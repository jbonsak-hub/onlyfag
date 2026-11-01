#!/usr/bin/env python3
"""Build locally hosted, projected NGU national geology overviews.

Input is the complete paginated EPSG:25833 FeatureServer response saved in
artifacts/geology. Keep raw query batches outside the published repository.
Requires Shapely 2. Re-run with --raw-dir /workspace/artifacts/geology.
"""
import argparse
import gzip
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from shapely import make_valid
from shapely.geometry import mapping, shape


parser = argparse.ArgumentParser()
parser.add_argument('--raw-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)


def read(name):
    return json.loads((args.raw_dir / (name + '.json')).read_text())


def colour(rgb):
    return '#' + ''.join(f'{v:02x}' for v in rgb[:3]) + ('00' if len(rgb) > 3 and rgb[3] == 0 else '')


def date(value):
    return datetime.fromtimestamp(value / 1000, timezone.utc).date().isoformat()


rock_meta = read('bedrock-n50-layer')
rock_domain = {v['code']: v['name'] for f in rock_meta['fields']
               if f['name'] == 'hovedbergart' for v in f['domain']['codedValues']}
rock_styles = {str(v['value']): {'label': v['label'], 'color': colour(v['symbol']['color'])}
               for v in rock_meta['drawingInfo']['renderer']['uniqueValueInfos']}
surface_meta = read('svv-sediments')
surface_palette = {v['value']: colour(v['symbol']['color'])
                   for v in surface_meta['drawingInfo']['renderer']['uniqueValueInfos']}
surface_names = {
    11: ('Morenemateriale, sammenhengende dekke, stedvis med stor mektighet', 'Morenemateriale, tykt dekke'),
    14: ('Avsmeltningsmorene (Ablasjonsmorene)', 'Avsmeltningsmorene'),
    31: ('Breelv- og bresjø-/brekammeravsetning (Glasifluvial og glasilakustrin avsetning)', 'Breelv- og bresjøavsetning'),
    41: ('Hav- og fjordavsetning, sammenhengende dekke, stedvis med stor mektighet', 'Hav- og fjordavsetning'),
    42: ('Marin strandavsetning, sammenhengende dekke', 'Marin strandavsetning'),
    50: ('Elve- og bekkeavsetning (Fluvial avsetning)', 'Elve- og bekkeavsetning'),
    73: ('Forvitringsmateriale, stein- og blokkrikt (blokkhav)', 'Forvitringsmateriale (blokkhav)'),
    81: ('Skredmateriale, sammenhengende dekke', 'Skredmateriale'),
    90: ('Torv og myr', 'Torv og myr'),
    140: ('Bart fjell/fjell med usammenhengende eller tynt løsmassedekke', 'Bart fjell / tynt løsmassedekke'),
}


def properties(kind, p):
    if kind == 'bedrock':
        code = p['hovedberg']
        style = rock_styles.get(str(code), {'color': '#e1e1e1', 'label': 'Ikke klassifisert'})
        return {'label': rock_domain.get(code, p['hovedberg_'].strip() or style['label']),
                'color': style['color'], 'description': p['tegnforkla'],
                'sourceScale': '1:1 350 000', 'sourceDate': date(p['datauttaks']),
                'sourceID': p['FID'], 'category': code}
    code = p['jordart']
    original, short = surface_names[code]
    props = {'label': short, 'color': surface_palette[original], 'description': original,
            'sourceScale': '1:1 000 000', 'sourceDate': date(p['datauttaks']),
            'sourceID': p['FID'], 'category': code}
    if len(props['color']) == 9:
        props['fillOpacity'] = 0
    return props


def rounded(c):
    if isinstance(c[0], (int, float)):
        return [round(c[0], 1), round(c[1], 1)]
    return [rounded(v) for v in c]


def polygonal(geom):
    if geom.geom_type in ('Polygon', 'MultiPolygon'):
        return geom
    pieces = [g for g in geom.geoms if g.geom_type in ('Polygon', 'MultiPolygon')]
    from shapely.ops import unary_union
    return unary_union(pieces)


manifest = {'coordinateSystem': 'EPSG:25833', 'fetchedOn': '2026-11-01',
            'description': 'NGUs berggrunn og løsmasser. Fagdataene er lagret på OnlyFag og kan brukes selv om NGUs karttjenester er utilgjengelige.',
            'license': 'NLOD', 'attribution': 'Inneholder data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Norges geologiske undersøkelse (NGU).',
            'layers': {}}
for kind, raw_name, title, item, service, scale in [
        ('bedrock', 'bedrock-n1350', 'Berggrunn', 'd7f4b8f9470947429a8b6c6ff0380b5b', 'https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/Geologi_0000_Norge_25833_BerggrunnN1350_SHAPE/FeatureServer/3', '1:1 350 000'),
        ('superficial', 'sediments-n1000', 'Løsmasser', '20771962f21b43a7a1dc90b20ef2f239', 'https://services.arcgis.com/2JyTvMWQSnM2Vi8q/arcgis/rest/services/L%C3%B8smasser_Norge/FeatureServer/2', '1:1 000 000')]:
    source = read(raw_name + '-native')
    features, repaired, empty, legend = [], 0, 0, {}
    for f in source['features']:
        g = shape(f['geometry'])
        if not g.is_valid:
            repaired += 1
            g = polygonal(make_valid(g))
        g = g.simplify(100, preserve_topology=True)
        if g.is_empty:
            empty += 1
            continue
        geo = mapping(g)
        props = properties(kind, f['properties'])
        legend[props['category']] = {key: props[key] for key in ('label', 'color', 'fillOpacity') if key in props}
        features.append({'type': 'Feature', 'properties': props,
                         'geometry': {'type': geo['type'], 'coordinates': rounded(geo['coordinates'])}})
    output = args.output / (kind + '-overview.json.gz')
    b = json.dumps({'type': 'FeatureCollection', 'coordinateSystem': 'EPSG:25833', 'features': features},
                   ensure_ascii=False, separators=(',', ':')).encode()
    compressed = gzip.compress(b, compresslevel=9, mtime=0)
    output.write_bytes(compressed)
    (args.output / (kind + '-overview.json')).unlink(missing_ok=True)
    source_dates = sorted({f['properties']['sourceDate'] for f in features})
    layer = {'title': title, 'overview': '../assets/geography/geology/data/' + output.name,
             'source': service, 'sourceItem': item, 'sourceScale': scale,
             'sourceDate': ', '.join(source_dates), 'overviewFeatures': len(features),
             'overviewBytes': len(compressed), 'overviewSHA256': hashlib.sha256(compressed).hexdigest(),
             'overviewUncompressedBytes': len(b), 'overviewUncompressedSHA256': hashlib.sha256(b).hexdigest(),
             'legend': sorted(legend.values(), key=lambda v: v['label']),
             'coverageNote': 'Landsdekkende oversikt, ' + scale + '. Dette er et generalisert oversiktskart.',
             'processing': {'simplificationMetres': 100, 'coordinatePrecisionMetres': .1,
                            'topologyRepairs': repaired, 'emptyFeatures': empty,
                            'sourceFeatures': len(source['features'])}}
    if kind == 'bedrock':
        layer['legend'] = sorted([{'label': rock_domain.get(int(code), style['label']) if code.isdigit() else style['label'], 'color': style['color']} for code, style in rock_styles.items()], key=lambda v: v['label'])
        layer['legend'].extend({'label': 'Uklassifisert kode ' + str(code), 'color': '#e1e1e1'} for code in [417, 436])
        layer['detailIndex'] = '../assets/geography/geology/data/bedrock-detail/index.json'
        layer['coverageNote'] = 'Landsdekkende oversikt i 1:1 350 000. Zoom inn for berggrunn i 1:250 000 og, der det er kartlagt, 1:50 000.'
    else:
        detail_path = args.output / 'superficial-detail/index.json'
        if detail_path.exists():
            detail = json.loads(detail_path.read_text())
            layer['detailIndex'] = '../assets/geography/geology/data/superficial-detail/index.json'
            layer['detailScale'] = 'Begrenset detaljuttrekk (SVV)'
            layer['detailSource'] = {
                'provider': 'NGU; deluttrekk publisert av Statens vegvesen',
                'source': 'https://services-eu1.arcgis.com/Omqj1DhF7kfdN8lE/arcgis/rest/services/Losmasse_KunRiksveg_Dissolve/FeatureServer/0',
                'sourceItem': '6772578bd7ed493fb0b70e57f73b35d6',
                'sourceDate': None,
                'nominalScale': None,
                'mirrorLicenseStatement': None,
            }
            layer['coverageNote'] = 'Landsdekkende oversikt i 1:1 000 000. Ved innzooming vises også et begrenset detaljuttrekk fra Statens vegvesen (omtrent 112 500 km²). Uttrekket har ufullstendig dekning og mangler oppgitt målestokk og dato i flatene; oversikten vises der detaljer mangler.'
            entries = layer['legend'] + [
                {k: v for k, v in entry.items() if k in ('label', 'color', 'pattern', 'strokeColor', 'fillOpacity')}
                for entry in detail['legend']]
            distinct = {json.dumps(v, sort_keys=True, ensure_ascii=False): v for v in entries}
            layer['legend'] = sorted(distinct.values(), key=lambda v: v['label'])
    manifest['layers'][kind] = layer
    print(kind, len(features), len(b), 'repairs', repaired, 'empty', empty)
(args.output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
