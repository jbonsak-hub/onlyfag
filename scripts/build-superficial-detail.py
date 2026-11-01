"""Build local sediment detail tiles from the public SVV extract of NGU data.

This source has limited, incompletely documented coverage. It is never treated
as national detailed coverage or assigned an inferred nominal survey scale/date.
Run with PYTHONPATH=/workspace/shared/municipality-python-deps.
Raw HTTP responses stay in /workspace/artifacts/geology; --check works offline.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse, gzip, hashlib, json, math, subprocess, urllib.parse

ROOT = Path(__file__).resolve().parents[1]
SERVICE = 'https://services-eu1.arcgis.com/Omqj1DhF7kfdN8lE/arcgis/rest/services/Losmasse_KunRiksveg_Dissolve/FeatureServer/0'
GRID = 50000
SOURCE_SCALE = 'Begrenset detaljuttrekk (SVV)'
RAW_GEOJSON = 'superficial-road-detail-geojson-20m.json'


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def read(path):
    return json.loads(path.read_bytes())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fetch(url, destination):
    temporary = destination.with_suffix(destination.suffix + '.partial')
    subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--retry', '2', '--max-time', '180', url, '-o', str(temporary)], check=True)
    data = read(temporary)
    if 'error' in data:
        raise RuntimeError(data['error'])
    temporary.replace(destination)
    return data


def download(raw):
    raw.mkdir(parents=True, exist_ok=True)
    params = {'f': 'geojson', 'where': '1=1', 'outFields': 'OBJECTID,losmassetype,FIRST_losmassetype_navn', 'returnGeometry': 'true', 'outSR': 25833, 'maxAllowableOffset': 20, 'geometryPrecision': 1}
    url = SERVICE + '/query?' + urllib.parse.urlencode(params)
    fetch(url, raw / RAW_GEOJSON)
    fetch(SERVICE + '?f=json', raw / 'detail-research-dissolve-layer.json')
    fetch(SERVICE + '/query?f=json&where=1%3D1&returnIdsOnly=true', raw / 'superficial-road-detail-ids.json')
    (raw / 'superficial-road-detail-request.json').write_bytes(encoded({'url': url, 'parameters': params, 'fetchedOn': datetime.now(timezone.utc).isoformat()}))


def styles(raw):
    source = read(raw / 'detail-research-dissolve-layer.json')
    supplement_path = raw / '0a48df595da44edd94bd9526dd5b3417-service.json'
    supplement = read(supplement_path if supplement_path.exists() else ROOT / 'assets/geography/geology/sources/geodata-sediment-style-supplement.json')
    lookup = {}
    for name, metadata in [('Geodata AS: saved 70-category renderer', supplement), ('Statens vegvesen: source renderer', source)]:
        for entry in metadata['drawingInfo']['renderer']['uniqueValueInfos']:
            symbol = entry['symbol']
            rgba = symbol['color']
            item = {'label': entry['label'], 'color': '#' + ''.join(f'{c:02x}' for c in rgba[:3]), 'originalRGBA': rgba, 'styleSource': name}
            if symbol.get('style') == 'esriSFSBackwardDiagonal':
                item['pattern'] = 'backward-diagonal'
                outline = symbol.get('outline', {}).get('color', [110, 110, 110, 255])
                item['strokeColor'] = '#' + ''.join(f'{c:02x}' for c in (outline[:3] if outline[3] == 255 else outline))
            if rgba[3] == 0:
                item['fillOpacity'] = 0
            lookup[str(entry['value'])] = item
    return lookup


def polygon_parts(g):
    if g.geom_type == 'Polygon':
        return [g]
    parts = []
    for part in getattr(g, 'geoms', []):
        parts.extend(polygon_parts(part))
    return parts


def build(raw, output):
    from shapely import make_valid, set_precision
    from shapely.geometry import shape, mapping, box, MultiPolygon
    data_path = raw / RAW_GEOJSON
    data = read(data_path)
    known_ids = read(raw / 'superficial-road-detail-ids.json')['objectIds']
    actual_ids = [f['properties']['OBJECTID'] for f in data['features']]
    assert sorted(actual_ids) == sorted(known_ids) and len(actual_ids) == len(set(actual_ids)) == 45
    assert data.get('crs', {}).get('properties', {}).get('name', '').endswith('25833'), 'source CRS must be preserved explicitly'
    lookup = styles(raw)
    tile_parts = {}
    properties = {}
    repairs, empty = 0, []
    categories = []
    for f in data['features']:
        p = f['properties']
        code = str(int(p['losmassetype']))
        assert code in lookup, 'Missing actual source style for ' + code
        style = {**lookup[code], 'label': p['FIRST_losmassetype_navn']}
        categories.append({'category': int(code), **style})
        source_id = p['OBJECTID']
        properties[source_id] = {k: v for k, v in style.items() if k not in ('styleSource', 'originalRGBA')}
        properties[source_id].update({'description': '', 'sourceScale': SOURCE_SCALE, 'sourceDate': None, 'sourceID': source_id, 'category': int(code)})
        g = shape(f['geometry'])
        if not g.is_valid:
            g = make_valid(g)
            repairs += 1
        kept = False
        # The 45 records are nationwide dissolved multipart classes. Split them
        # before spatial clipping so each small original part visits nearby cells.
        for part in polygon_parts(g):
            part = set_precision(part, 1, mode='valid_output')
            if part.is_empty:
                continue
            west, south, east, north = part.bounds
            for x in range(math.floor(west / GRID), math.floor(east / GRID) + 1):
                for y in range(math.floor(south / GRID), math.floor(north / GRID) + 1):
                    clipped = part.intersection(box(x * GRID, y * GRID, (x + 1) * GRID, (y + 1) * GRID))
                    pieces = [piece for piece in polygon_parts(clipped) if not piece.is_empty and piece.area > 0]
                    if not pieces:
                        continue
                    tile_parts.setdefault((x, y), {}).setdefault(source_id, []).extend(pieces)
                    kept = True
        if not kept:
            empty.append(source_id)
        print('Processed sediment category', code, 'source object', source_id, flush=True)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'tiles').mkdir(exist_ok=True)
    records, retained_ids = [], set()
    for (x, y), by_source in sorted(tile_parts.items()):
        features = []
        for source_id, parts in sorted(by_source.items()):
            g = parts[0] if len(parts) == 1 else MultiPolygon(parts)
            features.append({'type': 'Feature', 'id': 'svv-' + str(source_id), 'properties': properties[source_id], 'geometry': mapping(g)})
            retained_ids.add(source_id)
        content = encoded({'type': 'FeatureCollection', 'coordinateSystem': 'EPSG:25833', 'features': features})
        compressed = gzip.compress(content, compresslevel=9, mtime=0)
        tile_id = f'{x}_{y}'
        url = f'tiles/{tile_id}.json.gz'
        (output / url).write_bytes(compressed)
        records.append({'id': tile_id, 'url': url, 'bbox': [x * GRID, y * GRID, (x + 1) * GRID, (y + 1) * GRID], 'bytes': len(compressed), 'uncompressedBytes': len(content), 'featureCount': len(features), 'sha256': sha(compressed)})
    source_layer = read(raw / 'detail-research-dissolve-layer.json')
    request = read(raw / 'superficial-road-detail-request.json')
    index = {'title': 'NGU: begrenset løsmassedetaljuttrekk fra Statens vegvesen', 'coordinateSystem': 'EPSG:25833', 'coordinateUnits': 'metres', 'source': 'NGU', 'mirror': 'Statens vegvesen', 'sourceURL': SERVICE, 'sourceItem': '6772578bd7ed493fb0b70e57f73b35d6', 'sourceScale': SOURCE_SCALE, 'nominalSourceScale': None, 'sourceDate': None, 'sourceItemReportedDate': '2021-12-07', 'sourceItemDateNote': 'The item snippet says NGU 07.12.2021; its role as source extraction or survey date is unverified.', 'mirrorUpdatedOn': '2023-02-09', 'fetchedOn': request['fetchedOn'], 'sourceFeatureCount': 45, 'retainedSourceFeatureCount': len(retained_ids), 'sourceCategories': 45, 'compression': 'gzip', 'serverGeneralizationMeters': 20, 'simplificationMeters': 0, 'coordinateRoundingMeters': 1, 'gridSizeMeters': GRID, 'repairedSourceGeometries': repairs, 'omittedSourceIDs': empty, 'tileCount': len(records), 'totalBytes': sum(r['bytes'] for r in records), 'totalUncompressedBytes': sum(r['uncompressedBytes'] for r in records), 'sourceGeometrySha256': sha(data_path.read_bytes()), 'sourceRequest': request['url'], 'originalDataLicense': 'NGU data: NLOD (see saved national dataset metadata)', 'mirrorItemLicense': None, 'coverageNote': 'Begrenset geografisk detaljuttrekk. Kildetittelen nevner riksveg, mens itemets snippet nevner 250 meter fra registrert kvikkleire. Utvalgskriteriet kan derfor ikke fastslås. Nominell målestokk er ikke oppgitt. Itemets snippet nevner NGU 07.12.2021, men datoens rolle som uttrekks- eller kartleggingsdato er ikke verifisert. Nasjonalt N1000-oversiktskart beholdes der detaljer mangler.', 'styleNote': 'Source renderer styles are preserved where present; its 19 missing categories use the actual saved Geodata AS 70-category renderer. Labels come from source attributes. No geological classes or boundaries were inferred. RGB colours and diagonal hatching are retained. Nonzero source alpha is normalised to opaque so the map slider controls visibility consistently; source alpha zero clears the thematic scene over the recorded water polygon. Original RGBA is archived in this index legend.', 'legend': sorted(categories, key=lambda x: x['category']), 'tiles': records}
    (output / 'index.json').write_bytes(encoded(index))
    (raw / 'superficial-detail-legend.json').write_bytes(encoded(index['legend']))
    for old in (output / 'tiles').glob('*'):
        if old.name not in {Path(t['url']).name for t in records}:
            old.unlink()
    print('Built', len(records), 'sediment tiles,', index['totalBytes'], 'compressed bytes, retained', len(retained_ids), 'source objects', flush=True)
    check(output)


def check(output):
    index = read(output / 'index.json')
    assert index['coordinateSystem'] == 'EPSG:25833'
    assert index['sourceFeatureCount'] == index['retainedSourceFeatureCount'] == len(index['legend']) == 45
    ids = set()
    total = 0
    from shapely.geometry import shape
    for tile in index['tiles']:
        b = (output / tile['url']).read_bytes()
        assert sha(b) == tile['sha256'] and len(b) == tile['bytes']
        raw = gzip.decompress(b)
        assert len(raw) == tile['uncompressedBytes']
        d = json.loads(raw)
        assert d['coordinateSystem'] == 'EPSG:25833'
        assert len(d['features']) == tile['featureCount']
        for f in d['features']:
            ids.add(f['properties']['sourceID'])
            assert f['properties']['label'] and f['properties']['color'].startswith('#')
            g = shape(f['geometry'])
            assert not g.is_empty and g.is_valid, (tile['id'], f['id'])
            minx, miny, maxx, maxy = g.bounds
            x0, y0, x1, y1 = tile['bbox']
            assert minx >= x0 and miny >= y0 and maxx <= x1 and maxy <= y1
        total += len(b)
    assert len(ids) == 45 and total == index['totalBytes']
    print('PASS sediment detail:', len(index['tiles']), 'valid tiles, 45 source objects, SHA256/CRS/bounds/styles checked')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--raw', type=Path, default=Path('/workspace/artifacts/geology'))
    p.add_argument('--output', type=Path, default=ROOT / 'assets/geography/geology/data/superficial-detail')
    p.add_argument('--download', action='store_true')
    p.add_argument('--check', action='store_true')
    a = p.parse_args()
    if a.check:
        check(a.output)
    else:
        if a.download:
            download(a.raw)
        build(a.raw, a.output)
