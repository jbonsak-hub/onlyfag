#!/usr/bin/env python3
"""Offline regional browser graphs in one fixed, metre-derived coordinate frame."""
import argparse
import copy
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'assets/geography/drop-prototype'
SOURCES = DIR / 'sources'
PINS = {
    'east-supplement': 'b1f17dcc7caa87d24c5e33cf6e1d57ac1568db88ed28e47c008347f78e4eb7fa',
    'midtnorge': '320a74032b32a68b4a1f82e4514bf876894e85a1c9385b28b7465eeacaf41499',
    'nordnorge': '5043aecdd4c521ae8b220974323ba930f631a90d6b5256daedb3e1449899201e',
}

def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def encoded(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n').encode()

def pinned(name):
    path = SOURCES / name / 'elvis-directed-network.json.gz'
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == PINS[name], f'Unexpected source: {name}'
    return json.loads(gzip.decompress(raw))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--available', action='store_true', help='Development build using only available sources')
    parser.add_argument('--without-names', action='store_true', help='Development-only graph build')
    args = parser.parse_args()
    legacy = module('watershed_source', 'build-drop-prototype-data.py')
    south, provenance = legacy.load_sources()
    original = json.loads(legacy.build())
    west, _, _, north = original['source']['projectedBounds']
    units = original['unitsPerKm']
    projection = {'crs': 'EPSG:25833', 'west': west, 'north': north, 'unitsPerKm': units}
    extra = pinned('east-supplement')
    for key in ['basins', 'segments', 'starts']:
        south[key].extend(extra[key])
    # Preserve the three familiar Glomma tributary starts.
    for start in original['starts']:
        if start['id'] not in {b['id'] for b in south['basins']}:
            south['starts'].append(start)
    sources = [('south', 'Sør-Norge', south)]
    for name, label in [('midtnorge', 'Midt-Norge'), ('nordnorge', 'Nord-Norge')]:
        if args.available and (not (SOURCES/name/'elvis-directed-network.json.gz').exists() or PINS[name].startswith('PENDING')):
            continue
        sources.append((name, label, pinned(name)))
    names = None if args.without_names else module('watershed_names', 'build-watershed-name-labels.py')
    manifest = {'version': 1, 'defaultRegions': ['south'], 'projection': projection, 'regions': []}
    seen_basins, seen_segments = set(), set()
    def write(relative, content):
        target = DIR / relative
        if args.check:
            assert target.read_bytes().replace(b'\r\n', b'\n') == content, f'Rebuild {relative}'
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
    for key, label, raw in sources:
        graph = copy.deepcopy(raw)
        if names:
            print(f'Annotating {label}', flush=True)
            cache_key = hashlib.sha256(encoded(raw)+(ROOT/'scripts/build-watershed-name-labels.py').read_bytes()+(SOURCES/'names/manifest.json').read_bytes()).hexdigest()
            cache_dir = ROOT.parent/'watershed-build-cache'
            cache_file = cache_dir/(cache_key+'.json.gz')
            if cache_file.exists():
                cached = json.loads(gzip.decompress(cache_file.read_bytes()))
                assert set(cached['labels']) == {s['id'] for s in graph['segments']}
                for s in graph['segments']:
                    s['labels'] = cached['labels'][s['id']]
                graph['nameSource'] = cached['nameSource']
            else:
                annotated = names.annotate(graph)
                if annotated is not None:
                    graph = annotated
                cache_dir.mkdir(exist_ok=True)
                cache_file.write_bytes(gzip.compress(encoded({'labels':{s['id']:s['labels'] for s in graph['segments']},'nameSource':graph['nameSource']}),mtime=0))
        by_id = {s['id']: s for s in graph['segments']}
        geographic = legacy.Transformer.from_crs('EPSG:25833', 'EPSG:4326', always_xy=True)
        calibrations = [{'basin': b['id'], 'mainRoute': b['sourceMainRoute'],
                         'outletLongitudeLatitude': list(geographic.transform(*b['outlet'])),
                         'sourceMeasureRange': by_id[b['outletSegment']]['routeMeasureRange']} for b in graph['basins']]
        assert len(by_id) == len(graph['segments'])
        assert not seen_segments.intersection(by_id)
        assert not seen_basins.intersection(b['id'] for b in graph['basins'])
        seen_segments.update(by_id)
        seen_basins.update(b['id'] for b in graph['basins'])
        for s in graph['segments']:
            if s['next']:
                assert s['next'] in by_id and by_id[s['next']]['basin'] == s['basin']
                assert s['points'][-1] == by_id[s['next']]['points'][0]
        for s in graph['segments']:
            for label_interval in s.get('labels',[]):
                label_interval[2]=label_interval[2].strip() or ('Navnløs innsjø' if label_interval[3]=='lake' else 'Navnløs elv')
            for i in range(1,len(s.get('labels',[]))):
                s['labels'][i][0]=s['labels'][i-1][1]
            s['points'] = [[round((x-west)*units/1000, 4), round((north-y)*units/1000, 4)] for x,y in s['points']]
            for field in ['route', 'sourceObjectId', 'measuredDirection', 'routeMeasureRange']:
                s.pop(field, None)
        for b in graph['basins']:
            x,y = b['outlet']
            b['outlet'] = [round((x-west)*units/1000,4), round((north-y)*units/1000,4)]
            b['mapRegion'] = key
            b['outletLabel'] = legacy.OUTLET_LABELS.get(b['id'], b.get('outletLabel') or 'utløpet av '+b['name'])
        points = [p for s in graph['segments'] for p in s['points']]
        bounds = [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]
        starts = {s['id']: s for s in graph['starts']}
        for b in graph['basins']:
            starts.setdefault(b['id'], {'id': b['id'], 'label': b['name'], 'segment': b['outletSegment'], 'fraction': .05})
        data = {'version': 2, 'regionId': key, 'regionTitle': label, 'projection': projection,
                'bounds': bounds, 'viewBox': bounds, 'yUp': False, 'unitsPerKm': units,
                'basins': graph['basins'], 'segments': graph['segments'], 'starts': list(starts.values()),
                'source': {**original['source'], 'regionId': key, 'outletCalibrations': calibrations, 'waterbodyNames': graph.get('nameSource'),
                           'selection': 'Whole measured river families for '+label+'; routes >=5 km or mapped catchment >=2 km².',
                           'normalizedSources': (provenance+[{'file': 'assets/geography/drop-prototype/sources/east-supplement/elvis-directed-network.json.gz', 'sha256': PINS['east-supplement']}]) if key=='south' else [{'file': f'assets/geography/drop-prototype/sources/{key}/elvis-directed-network.json.gz','sha256': PINS[key]}],
                           'validation': {**graph['validation'], 'segmentCount':len(graph['segments']), 'routableSegments':sum(s['routable'] for s in graph['segments'])}}}
        content = encoded(data)
        assert len(content) < 20_000_000, f'{label} exceeds per-region budget'
        digest = hashlib.sha256(content).hexdigest()[:12]
        relative = f'regions/{key}-{digest}.json'
        write(relative, content)
        manifest['regions'].append({'id': key, 'label': label, 'url': relative, 'bounds': bounds,
                                    'basins': len(graph['basins']), 'segments': len(graph['segments']), 'bytes': len(content)})
    write('regions.json', encoded(manifest))
    print(json.dumps({'regions': manifest['regions'], 'named': names is not None}, ensure_ascii=False))

if __name__ == '__main__':
    main()
