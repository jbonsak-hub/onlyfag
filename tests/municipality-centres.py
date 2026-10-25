"""Check seat identity, historical-code isolation and every projected centre point."""
import importlib.util
import json
import math
from collections import Counter
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
spec = importlib.util.spec_from_file_location('centres', ROOT / 'scripts/build-municipality-centres.py')
builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
atlas = builder.load_builder()
data = json.loads((GEO / 'municipality-centres.json').read_text(encoding='utf-8'))
index = json.loads((GEO / 'municipalities/index-v3.json').read_text(encoding='utf-8'))
assert set(data['regions']) == {'county-'+county['code'] for county in index['counties']}
project = Transformer.from_crs('EPSG:4326', 'EPSG:25833', always_xy=True).transform
geometries = {feature['properties']['kommunenummer']: transform(project, shape(feature['geometry'])).buffer(0)
              for feature in atlas.decode_topology(atlas.read_json_gzip(atlas.BOUNDARY_SOURCE))}
all_rows = {}; count = 0; points = 0; sources = Counter()
for county in index['counties']:
    geometry = json.loads((GEO / 'municipalities' / county['file']).read_text(encoding='utf-8'))
    centres = data['regions']['county-'+county['code']]['centres']
    assert set(centres) == {state['n'] for state in geometry['states']}
    canvas = atlas.Canvas(unary_union([geometries[state['a']] for state in geometry['states']]).bounds)
    assert canvas.view_box == geometry['viewBox']
    prompts = []
    for state in geometry['states']:
        row = centres[state['n']]; assert row['code'] == state['a']
        assert row['name'] and 'Q' != row['name'][0]
        prompts.append(row.get('promptName', row['name']))
        locations = row.get('locations', [row]); count += 1; points += len(locations)
        if len(locations)>1:
            assert row['name'] == ' / '.join(location['name'] for location in locations)
            assert row['p'] == locations[0]['p']
        for location in locations:
            assert all(math.isfinite(location[k]) for k in ['lon', 'lat'])
            assert 3 < location['lon'] < 33 and 57 < location['lat'] < 72
            x,y = project(location['lon'], location['lat'])
            expected = [16+(x-canvas.xmin)*canvas.scale, 16+(canvas.ymax-y)*canvas.scale]
            assert max(abs(a-b) for a,b in zip(location['p'],expected)) <= .000501
            assert 0 <= location['p'][0] <= geometry['viewBox'][2]
            assert 0 <= location['p'][1] <= geometry['viewBox'][3]
            gap = geometries[state['a']].distance(Point(x,y))
            assert abs(gap-location['geometryDistanceMetres']) <= .006
            assert gap < 100, (state['n'], location['name'], gap)
            assert location['outsideGeometry'] == (not geometries[state['a']].covers(Point(x,y)))
            assert location['coordinateSourceURL'].startswith('https://')
            sources[location['coordinateSource']] += 1
        if state['a'] in all_rows:
            old = all_rows[state['a']]
            assert (old['name'],old['lon'],old['lat']) == (row['name'],row['lon'],row['lat'])
        all_rows[state['a']] = row
    assert len(set(prompts)) == len(prompts), county['name']+' has unambiguous questions'
assert count == 387 and len(all_rows) == 357 and points == 389
# These reused municipal codes must never select a dissolved municipality's seat.
for code, expected in {'1806':'Narvik','1853':'Bogen','1860':'Leknes','1833':'Mo i Rana',
                       '1813':'Brønnøysund','1119':'Varhaug','1554':'Bruhagen',
                       '1149':'Kopervik','1871':'Andenes','3207':'Ski','3118':'Askim',
                       '3203':'Asker','3205':'Lillestrøm','4205':'Mandal','3222':'Kjenn',
                       '4032':'Fyresdal','5034':'Midtbygda','5054':'Rissa'}.items():
    assert all_rows[code]['name'] == expected, (code, all_rows[code]['name'])
assert [p['name'] for p in all_rows['4602']['locations']] == ['Florø','Måløy']
assert [p['name'] for p in all_rows['5060']['locations']] == ['Kolvereid','Rørvik']
assert all_rows['1528']['promptName'] == 'Aure (Sykkylven)'
assert all_rows['1576']['promptName'] == 'Aure (Aure)'
assert len(all_rows['4602']['primarySources']) >= 1 and len(all_rows['5060']['primarySources']) >= 1
# SSR filtering is a municipality join, not a same-name global geocoder.
source,_ = builder.read_sources()
wrong = {'ssr': {'0301': {'Qx': [{'url':'https://example.invalid', 'data': {'navn': [{
    'kommuner':[{'kommunenummer':'4601'}], 'stedstatus':'aktiv', 'skrivemåtestatus':'vedtatt',
    'skrivemåte':'Oslo','navneobjekttype':'By', 'representasjonspunkt':{'øst':10.73,'nord':59.91}, 'stedsnummer':1}]}}]}}, 'aliasQueries':{}}
location,meta = builder.select_point(wrong,'0301',{'name':'Oslo','originalName':'Oslo','qid':'Qx','coordinates':[(10.7388,59.9133)]},geometries['0301'],project)
assert meta['coordinateSource'] == 'Wikidata place'
# A same-name island centroid also must not replace a sourced settlement point.
record = wrong['ssr']['0301']['Qx'][0]['data']['navn'][0]
record['kommuner'] = [{'kommunenummer':'0301'}]
record['navneobjekttype'] = 'Øy i sjø'
location,meta = builder.select_point(wrong,'0301',{'name':'Oslo','originalName':'Oslo','qid':'Qx','coordinates':[(10.7388,59.9133)]},geometries['0301'],project)
assert meta['coordinateSource'] == 'Wikidata place' and location == (10.7388,59.9133)
assert source['ssr']['0301']
print('PASS 357 current municipalities / 387 map targets / 389 sourced seat points')
print('PASS historical-code isolation, two shared seats, Aure qualifiers, SSR municipal filtering')
print('PASS all exact UTM/canvas projections, own geometry and source references', dict(sources))
