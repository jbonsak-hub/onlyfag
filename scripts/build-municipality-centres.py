"""Build offline municipal seats from pinned Wikidata/SSR records and exact map fits.

Requires the existing municipality Python dependencies. This build is offline;
the dated source snapshot records every public query and response used.
"""
import argparse
import gzip
import hashlib
import importlib.util
import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
SOURCE = GEO / 'municipalities/sources/municipality-centres-2026.json.gz'
OUTPUT = GEO / 'municipality-centres.json'
OVERRIDES = GEO / 'municipalities/sources/municipality-centre-primary-checks.json'
# Public names retain the wording used by the municipality rather than imposing
# the spelling of a neighbouring municipality or the name of a postal address.
DISPLAY_NAMES = {'3203': 'Asker', '4032': 'Fyresdal', '4646': 'Dale'}
SSR_ALIASES = {'1144': ['Ydstebøhamn'], '3203': ['Asker'], '4032': ['Fyresdal'],
               '1848': ['Leinesfjorden'], '3114': ['Kirkebygda'],
               '4646': ['Dale'], '4621': ['Vossavangen'], '5034': ['Meråker'], '1532': ['Valderhaugstranda'],
               '1511': ['Fiskå'], '3124': ['Fossby'], '3425': ['Engerdalen'], '1560': ['Tingvoll']}
SETTLEMENTS = {'By', 'Tettsted', 'Tettbebyggelse', 'Tettsteddel', 'Bygdelag (bygd)', 'Grend', 'Boligfelt'}
EXCLUDED = {'Kommune', 'Fylke', 'Grunnkrets', 'Annen administrativ inndeling', 'Adressenavn'}


def normal(name):
    return re.sub(r'\s+kommune$', '', unicodedata.normalize('NFC', name).casefold()).replace('–', '-')


def distance(a, b):
    lat = math.radians((a[1]+b[1])/2)
    return math.hypot((a[0]-b[0])*111320*math.cos(lat), (a[1]-b[1])*111320)


def load_builder():
    spec = importlib.util.spec_from_file_location('municipality_builder', ROOT / 'scripts/build-norway-municipality-assets.py')
    builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
    return builder


def read_sources():
    raw = SOURCE.read_bytes()
    return json.loads(gzip.decompress(raw)), hashlib.sha256(raw).hexdigest()


def current_records(source, states):
    rows = defaultdict(list)
    for record in source['wikidata']['data']['results']['bindings']:
        code = record['code']['value']
        if code in states and normal(record['mLabel']['value']) in {normal(n) for n in states[code]['n'].split(' - ')}:
            rows[code].append(record)
    assert set(rows) == set(states), 'Every current code must match its current named municipality'
    out = {}
    for code, records in rows.items():
        places = defaultdict(list)
        for record in records: places[record['c']['value'].rsplit('/', 1)[-1]].append(record)
        centres = []
        for qid, variants in places.items():
            name = DISPLAY_NAMES.get(code, variants[0]['cLabel']['value'])
            coordinates = [tuple(map(float, re.findall(r'[-\d.]+', row['coord']['value']))) for row in variants]
            assert all(len(point) == 2 for point in coordinates)
            centres.append({'name': name, 'qid': qid, 'municipalityQid': variants[0]['m']['value'].rsplit('/', 1)[-1],
                            'coordinates': coordinates, 'originalName': variants[0]['cLabel']['value']})
        out[code] = sorted(centres, key=lambda row: row['name'])
    return out


def select_point(source, code, centre, geometry, project):
    queries = source['ssr'].get(code, {}).get(centre['qid'], []) + source.get('aliasQueries', {}).get(code, [])
    aliases = {normal(n) for n in [centre['name'], centre['originalName'], *SSR_ALIASES.get(code, [])]}
    candidates = []
    for query in queries:
        for row in query['data'].get('navn', []):
            if code not in {m['kommunenummer'] for m in row.get('kommuner', [])}: continue
            if row.get('stedstatus') != 'aktiv' or 'historisk' in row.get('skrivemåtestatus', ''): continue
            if normal(row['skrivemåte']) not in aliases or row['navneobjekttype'] in EXCLUDED: continue
            if row['navneobjekttype'] not in SETTLEMENTS | {'Rådhus'}: continue
            point = row['representasjonspunkt']; coord = (point['øst'], point['nord'])
            delta = min(distance(coord, p) for p in centre['coordinates'])
            if delta > 15000: continue
            # A same-name island, peninsula or farm's representation point is
            # not the settlement centre. Keep only settlement/town-hall points.
            tier = 0 if row['navneobjekttype'] in SETTLEMENTS else 1
            candidates.append((tier, delta, row['stedsnummer'], coord, row, query['url']))
    if candidates:
        _, delta, _, coord, row, url = min(candidates, key=lambda v: v[:3])
        metadata = {'coordinateSource': 'Kartverket SSR', 'coordinateSourceURL': url,
                    'ssrId': row['stedsnummer'], 'ssrName': row['skrivemåte'],
                    'ssrType': row['navneobjekttype'], 'coordinateRefinementMetres': round(delta, 1)}
    else:
        # A small number of municipal seats have no settlement entry under the
        # municipality's name in SSR. Keep the actual sourced place coordinate,
        # preferring a same-place alternative that lies in the municipality.
        coord = min(centre['coordinates'], key=lambda p: geometry.distance(Point(project(*p)))); metadata = {
            'coordinateSource': 'Wikidata place', 'coordinateSourceURL': 'https://www.wikidata.org/wiki/'+centre['qid']}
    point = Point(project(*coord)); outside = not geometry.covers(point)
    metadata.update({'outsideGeometry': outside, 'geometryDistanceMetres': round(geometry.distance(point), 2)})
    return coord, metadata


def build():
    source, source_hash = read_sources()
    index = json.loads((GEO / 'municipalities/index-v3.json').read_text(encoding='utf-8'))
    maps = [(county, json.loads((GEO / 'municipalities' / county['file']).read_text(encoding='utf-8'))) for county in index['counties']]
    states = {state['a']: state for _, data in maps for state in data['states']}
    assert len(states) == 357
    records = current_records(source, states)
    builder = load_builder(); project = Transformer.from_crs('EPSG:4326', 'EPSG:25833', always_xy=True).transform
    geometries = {feature['properties']['kommunenummer']: transform(project, shape(feature['geometry'])).buffer(0)
                  for feature in builder.decode_topology(builder.read_json_gzip(builder.BOUNDARY_SOURCE))}
    primary = json.loads(OVERRIDES.read_text(encoding='utf-8-sig'))
    verified = {row['code']: row for row in [*primary['records'], *primary.get('additionalAliases', [])]}
    selected = {}
    for code, centres in records.items():
        selected[code] = []
        for centre in centres:
            coord, metadata = select_point(source, code, centre, geometries[code], project)
            selected[code].append({'name': centre['name'], 'lon': coord[0], 'lat': coord[1],
                                   'wikidataPlace': centre['qid'], 'wikidataMunicipality': centre['municipalityQid'], **metadata})
    result = {'version': 1, 'checkedAt': source['checkedAt'], 'sourceSHA256': source_hash,
              'sources': {'seatIdentity': 'Wikidata P36 joined to current named municipality P2504; primary municipal checks for special cases',
                          'coordinates': 'Kartverket SSR settlement/town-hall representation points, with explicit Wikidata place fallbacks',
                          'snapshot': 'municipalities/sources/municipality-centres-2026.json.gz',
                          'primaryChecks': 'municipalities/sources/municipality-centre-primary-checks.json'}, 'regions': {}}
    for county, data in maps:
        canvas = builder.Canvas(unary_union([geometries[state['a']] for state in data['states']]).bounds)
        assert canvas.view_box == data['viewBox']
        centres = {}
        names = Counter(location['name'] for state in data['states'] for location in selected[state['a']])
        for state in data['states']:
            locations = []
            for base in selected[state['a']]:
                x, y = project(base['lon'], base['lat'])
                location = {**base, 'p': [round(16+(x-canvas.xmin)*canvas.scale, 3),
                                         round(16+(canvas.ymax-y)*canvas.scale, 3)]}
                if names[base['name']] > 1: location['promptName'] = base['name']+' ('+state['n']+')'
                locations.append(location)
            row = {**locations[0], 'code': state['a'], 'name': ' / '.join(location['name'] for location in locations)}
            if len(locations)>1: row['locations'] = locations
            elif 'promptName' in locations[0]: row['promptName'] = locations[0]['promptName']
            if state['a'] in verified: row['primarySources'] = verified[state['a']]['sources']
            centres[state['n']] = row
        result['regions']['county-'+county['code']] = {'centres': centres}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--check', action='store_true'); args = parser.parse_args()
    result = build(); text = json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n'
    if args.check: assert OUTPUT.read_text(encoding='utf-8') == text, 'Rebuild municipal centres'
    else: OUTPUT.write_text(text, encoding='utf-8')
    print('PASS' if args.check else 'Built', sum(len(region['centres']) for region in result['regions'].values()), 'municipal-centre targets across', len(result['regions']), 'county maps')


if __name__ == '__main__': main()
