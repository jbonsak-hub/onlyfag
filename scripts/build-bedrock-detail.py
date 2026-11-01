"""Acquire NGU N50 polygons and tile them over the local N250 source.

Run with PYTHONPATH=/workspace/shared/municipality-python-deps.
Raw service snapshots stay outside git in /workspace/artifacts/geology.
--download retrieves the source; default rebuilds offline; --check checks local output.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import argparse, gzip, hashlib, json, math, subprocess, urllib.parse

ROOT = Path(__file__).resolve().parents[1]
SERVICE = 'https://services5.arcgis.com/G7Y9uUZA3azviLFK/arcgis/rest/services/Berggrunn_N50/FeatureServer/5'
N250_SERVICE = 'https://services5.arcgis.com/G7Y9uUZA3azviLFK/arcgis/rest/services/Bergartflate_N250/FeatureServer/5'
GRID = 50000
OFFSET = 20
LICENSE = 'NLOD (NGU source data; mirror has no separate licence statement)'
PALETTE_INFO = {
    'sourceURL': SERVICE,
    'field': 'hovedbergart',
    'normalization': 'Exact N50 renderer RGB colours are used for the same hovedbergart code at both scales. N250 differs for the null class and codes 130, 131 and 132; these are deliberately harmonised to N50 for one consistent legend. Original per-feature N250 names are retained.',
    'unclassifiedCodes': ['417', '436'],
    'unclassifiedNote': 'These N50 source codes lack both renderer entries and domain names. Their polygons and original descriptions are retained, with explicit unclassified labels and neutral #e1e1e1 display colour.'
}


def encoded(data):
    return (json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def read(path):
    return json.loads(path.read_bytes())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def curl_json(url, dest):
    temp = dest.with_suffix(dest.suffix + '.partial')
    result = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--retry', '2', '--max-time', '120', url, '-o', str(temp)], capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode())
    data = read(temp)
    if 'error' in data:
        raise RuntimeError(data['error'])
    temp.replace(dest)
    return data


def download(raw, include_n250=False):
    raw.mkdir(parents=True, exist_ok=True)
    layer = curl_json(SERVICE + '?f=json', raw / 'bedrock-n50-layer.json')
    ids = sorted(curl_json(SERVICE + '/query?' + urllib.parse.urlencode({'where': '1=1', 'returnIdsOnly': 'true', 'f': 'json'}), raw / 'bedrock-n50-ids.json')['objectIds'])
    batches = raw / 'bedrock-n50-batches'
    batches.mkdir(exist_ok=True)
    previous = raw / 'bedrock-n50-downloads.json'
    cached = read(previous) if previous.exists() else {}
    reuse = cached.get('layerLastEditDate') == layer.get('editingInfo', {}).get('lastEditDate') and cached.get('featureCount') == len(ids)

    def fetch(offset):
        dest = batches / f'{offset:06}.json'
        params = {'where': '1=1', 'outFields': '*', 'outSR': 25833, 'maxAllowableOffset': OFFSET,
                  'resultOffset': offset, 'resultRecordCount': 2000, 'orderByFields': 'OBJECTID ASC', 'f': 'geojson'}
        if reuse and dest.exists():
            data = read(dest)
        else:
            data = curl_json(SERVICE + '/query?' + urllib.parse.urlencode(params), dest)
        expected = ids[offset:offset + 2000]
        actual = [f['properties']['OBJECTID'] for f in data['features']]
        if actual != expected:
            raise RuntimeError(f'Incomplete/unstable source batch {offset}: {len(actual)} features, expected {len(expected)}')
        content = dest.read_bytes()
        print(f'Batch {offset}: {len(actual)} polygons, {len(content)} bytes', flush=True)
        return {'offset': offset, 'url': SERVICE + '/query?' + urllib.parse.urlencode(params), 'file': str(dest.relative_to(raw)), 'features': len(actual), 'bytes': len(content), 'sha256': sha(content)}

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(fetch, range(0, len(ids), 2000)))
    (raw / 'bedrock-n50-downloads.json').write_bytes(encoded({'source': SERVICE, 'fetchedOn': datetime.now(timezone.utc).isoformat(), 'featureCount': len(ids), 'layerLastEditDate': layer.get('editingInfo', {}).get('lastEditDate'), 'batches': results}))
    if include_n250:
        download_n250(raw)


def download_n250(raw):
    """The national N250 source is kept below the partial N50 detailed coverage."""
    raw.mkdir(parents=True, exist_ok=True)
    layer = curl_json(N250_SERVICE + '?f=json', raw / 'bedrock-n250-layer.json')
    ids = sorted(curl_json(N250_SERVICE + '/query?' + urllib.parse.urlencode({'where': '1=1', 'returnIdsOnly': 'true', 'f': 'json'}), raw / 'bedrock-n250-ids.json')['objectIds'])
    batches = raw / 'bedrock-n250-batches'
    batches.mkdir(exist_ok=True)
    previous = raw / 'bedrock-n250-downloads.json'
    cached = read(previous) if previous.exists() else {}
    reuse = cached.get('layerLastEditDate') == layer.get('editingInfo', {}).get('lastEditDate') and cached.get('featureCount') == len(ids)

    def fetch(offset):
        dest = batches / f'{offset:06}.json'
        params = {'where': '1=1', 'outFields': '*', 'outSR': 25833, 'maxAllowableOffset': OFFSET,
                  'resultOffset': offset, 'resultRecordCount': 1000, 'orderByFields': 'OBJECTID ASC', 'f': 'geojson'}
        data = read(dest) if reuse and dest.exists() else curl_json(N250_SERVICE + '/query?' + urllib.parse.urlencode(params), dest)
        actual = [f['properties']['OBJECTID'] for f in data['features']]
        if actual != ids[offset:offset + 1000]:
            raise RuntimeError(f'Incomplete/unstable N250 source batch {offset}')
        content = dest.read_bytes()
        print(f'N250 batch {offset}: {len(actual)} polygons, {len(content)} bytes', flush=True)
        return data['features'], {'offset': offset, 'parameters': params, 'file': str(dest.relative_to(raw)), 'features': len(actual), 'bytes': len(content), 'sha256': sha(content)}

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(fetch, range(0, len(ids), 1000)))
    native = {'type': 'FeatureCollection', 'coordinateSystem': 'EPSG:25833', 'features': [feature for features, _ in results for feature in features]}
    (raw / 'bedrock-n250-native.json').write_bytes(encoded(native))
    (raw / 'bedrock-n250-downloads.json').write_bytes(encoded({'source': N250_SERVICE, 'fetchedOn': datetime.now(timezone.utc).isoformat(), 'featureCount': len(ids), 'layerLastEditDate': layer.get('editingInfo', {}).get('lastEditDate'), 'batches': [entry for _, entry in results]}))


def check(output):
    index = read(output / 'index.json')
    assert index['coordinateSystem'] == 'EPSG:25833'
    assert index['sourceFeatureCount'] == sum(source['featureCount'] for source in index['sources'])
    total = 0
    ids = set()
    for tile in index['tiles']:
        content = (output / tile['url']).read_bytes()
        assert len(content) == tile['bytes'] and sha(content) == tile['sha256'], tile['id']
        text = gzip.decompress(content)
        assert len(text) == tile['uncompressedBytes']
        data = json.loads(text)
        assert data['coordinateSystem'] == 'EPSG:25833'
        assert len(data['features']) == tile['featureCount']
        for f in data['features']:
            assert f['geometry']['type'] in ('Polygon', 'MultiPolygon')
            assert f['properties']['color'].startswith('#')
            assert f['properties']['label']
            ids.add(f['id'])
        total += len(content)
    assert total == index['totalBytes']
    assert total < 50_000_000, 'Keep locally hosted detail below 50MB without removing source detail'
    assert len(ids) == index['retainedSourceFeatureCount']
    print(f'PASS bedrock detail: {len(index["tiles"])} tiles, {len(ids)} distinct source polygons, {total} bytes')


def build(raw, output, include_n250=False):
    from shapely import make_valid, set_precision
    from shapely.geometry import shape, mapping, box, MultiPolygon
    meta = read(raw / 'bedrock-n50-layer.json')
    provenance = read(raw / 'bedrock-n50-downloads.json')
    renderer = meta['drawingInfo']['renderer']
    styles = {str(v['value']): {'label': v['label'], 'color': '#' + ''.join(f'{c:02x}' for c in v['symbol']['color'][:3])} for v in renderer['uniqueValueInfos']}
    # These source codes occur in N50 but are absent from its domain and renderer.
    # Retain them explicitly; a neutral display colour makes no geological claim.
    for code in ['417', '436']:
        styles[code] = {'label': f'Uklassifisert kode {code}', 'color': '#e1e1e1'}
    domain = next(f['domain'] for f in meta['fields'] if f['name'] == 'hovedbergart')
    names = {str(v['code']): v['name'] for v in domain['codedValues']}
    records = []
    repairs = 0
    omitted = []
    source_ids = set()
    tiles = {}
    source_records = []

    def polygonal(g):
        if g.geom_type in ('Polygon', 'MultiPolygon'):
            return g
        parts = []
        for part in getattr(g, 'geoms', []):
            q = polygonal(part)
            if q.geom_type == 'Polygon':
                parts.append(q)
            elif q.geom_type == 'MultiPolygon':
                parts.extend(q.geoms)
        return MultiPolygon(parts)

    def n50_batches():
        for batch in provenance['batches']:
            content = (raw / batch['file']).read_bytes()
            assert sha(content) == batch['sha256']
            yield json.loads(content)['features']

    datasets = []
    if include_n250:
        national = raw / 'bedrock-n250-native.json'
        n250 = read(national)
        assert n250['coordinateSystem'] == 'EPSG:25833'
        datasets.append({'id': 'n250', 'scale': '1:250 000', 'count': 30903, 'url': N250_SERVICE, 'batches': [n250['features']], 'sha256': sha(national.read_bytes())})
    datasets.append({'id': 'n50', 'scale': '1:50 000', 'count': provenance['featureCount'], 'url': SERVICE, 'batches': n50_batches()})
    for dataset in datasets:
      dataset_ids = set()
      for features in dataset['batches']:
        for f in features:
            p = f['properties']
            sid = p['OBJECTID']
            fid = dataset['id'] + '-' + str(sid)
            assert fid not in source_ids
            source_ids.add(fid)
            dataset_ids.add(sid)
            if not f['geometry']:
                omitted.append({'id': fid, 'sourceID': sid, 'reason': 'source geometry is null after server generalisation'})
                continue
            g = shape(f['geometry'])
            if not g.is_valid:
                g = polygonal(make_valid(g))
                repairs += 1
            g = polygonal(set_precision(g, 1, mode='valid_output'))
            if g.is_empty:
                omitted.append({'id': fid, 'sourceID': sid, 'reason': 'no polygonal area after 1m coordinate rounding'})
                continue
            code = str(p['hovedbergart']) if p['hovedbergart'] is not None else '<Null>'
            assert code in styles, f'Unmapped source renderer code {code}'
            style = styles[code]
            stamp = p.get('datauttaksdato')
            source_date = datetime.fromtimestamp(stamp / 1000, timezone.utc).date().isoformat() if stamp else None
            properties = {'label': p.get('hovedbergart_navn') or names.get(code, style['label']), 'color': style['color'], 'description': p.get('tegnforklaring') or '', 'sourceScale': dataset['scale'], 'sourceDate': source_date, 'sourceID': sid, 'category': p['hovedbergart']}
            west, south, east, north = g.bounds
            retained = False
            for x in range(math.floor(west / GRID), math.floor(east / GRID) + 1):
                for y in range(math.floor(south / GRID), math.floor(north / GRID) + 1):
                    clipped = polygonal(g.intersection(box(x * GRID, y * GRID, (x + 1) * GRID, (y + 1) * GRID)))
                    if clipped.is_empty or clipped.area == 0:
                        continue
                    clipped = polygonal(set_precision(clipped, 1, mode='valid_output'))
                    if clipped.is_empty:
                        continue
                    feature = {'type': 'Feature', 'id': fid, 'properties': properties, 'geometry': mapping(clipped)}
                    tiles.setdefault((x, y), []).append(feature)
                    retained = True
            if not retained:
                omitted.append({'id': fid, 'sourceID': sid, 'reason': 'no polygonal area in output tiles'})
        print(f'Processed {len(source_ids)} source polygons', flush=True)
      assert len(dataset_ids) == dataset['count']
      source_records.append({'id': dataset['id'], 'sourceURL': dataset['url'], 'sourceScale': dataset['scale'], 'featureCount': len(dataset_ids), **({'rawSha256': dataset['sha256']} if dataset.get('sha256') else {})})
    assert len(source_ids) == sum(d['count'] for d in datasets)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'tiles').mkdir(exist_ok=True)
    retained_ids = set()

    def integer_coords(c):
        if isinstance(c[0], (int, float)):
            return [int(round(c[0])), int(round(c[1]))]
        return [integer_coords(v) for v in c]

    for (x, y), features in sorted(tiles.items()):
        tid = f'{x}_{y}'
        for f in features:
            f['geometry']['coordinates'] = integer_coords(f['geometry']['coordinates'])
            retained_ids.add(f['id'])
        collection = {'type': 'FeatureCollection', 'coordinateSystem': 'EPSG:25833', 'features': features}
        content = encoded(collection)
        compressed = gzip.compress(content, compresslevel=9, mtime=0)
        (output / 'tiles' / (tid + '.json.gz')).write_bytes(compressed)
        records.append({'id': tid, 'url': f'tiles/{tid}.json.gz', 'bbox': [x * GRID, y * GRID, (x + 1) * GRID, (y + 1) * GRID], 'bytes': len(compressed), 'uncompressedBytes': len(content), 'featureCount': len(features), 'sha256': sha(compressed)})
    index = {'title': 'NGU: berggrunn N250 og N50 – lokal detaljvisning', 'coordinateSystem': 'EPSG:25833', 'coordinateUnits': 'metres', 'source': 'NGU', 'sourceURL': SERVICE, 'mirror': 'NGU / ArcGIS Online', 'sourceScale': '1:250 000 og 1:50 000' if include_n250 else '1:50 000', 'sources': source_records, 'license': LICENSE, 'fetchedOn': provenance['fetchedOn'], 'compression': 'gzip', 'serverGeneralizationMeters': OFFSET, 'simplificationMeters': 0, 'coordinateRoundingMeters': 1, 'gridSizeMeters': GRID, 'sourceFeatureCount': len(source_ids), 'retainedSourceFeatureCount': len(retained_ids), 'repairedSourceGeometries': repairs, 'omittedSourceFeatures': omitted, 'tileCount': len(records), 'totalBytes': sum(t['bytes'] for t in records), 'totalUncompressedBytes': sum(t['uncompressedBytes'] for t in records), 'drawOrder': [d['id'] for d in datasets], 'coverageNote': 'N250 dekker større områder. N50-kartlagte områder har ufullstendig geografisk dekning og tegnes øverst. Fravær av detaljpolygon betyr ikke fravær av berggrunn. Nasjonalt oversiktskart beholdes under detaljlaget.', 'note': 'Projected feature collections, not RFC 7946. Original NGU polygons, generalised by service to 20m, repaired only where invalid, clipped to 50km grid and coordinates rounded to 1m; no synthetic or extrapolated coverage. Source codes 417 and 436 lack a renderer/domain label and use explicit unclassified labels and neutral gray.', 'styles': {code: {**style, 'label': names.get(code, style['label'])} for code, style in styles.items()}, 'tiles': records}
    index['classificationPalette'] = PALETTE_INFO
    index['maximumTileBytes'] = max(t['bytes'] for t in records)
    index['maximumUncompressedTileBytes'] = max(t['uncompressedBytes'] for t in records)
    (output / 'index.json').write_bytes(encoded(index))
    for old in (output / 'tiles').glob('*'):
        if old.name not in {Path(r['url']).name for r in records}:
            old.unlink()
    print(f'Built {len(records)} tiles: {index["totalBytes"]} bytes; {repairs} invalid source geometries repaired, {len(omitted)} source features omitted')
    check(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raw', type=Path, default=Path('/workspace/artifacts/geology'))
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/geography/geology/data/bedrock-detail')
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--download-only', action='store_true')
    parser.add_argument('--include-n250', action='store_true', help='Draw the complete N250 source first, underneath partial N50 coverage')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        check(args.output)
    else:
        if args.download or args.download_only:
            download(args.raw, args.include_n250)
        if not args.download_only:
            build(args.raw, args.output, args.include_n250)
