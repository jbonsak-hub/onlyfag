"""Offline Natural Earth 10m water overlay, registered to the MapWiz raster."""
import gzip
import hashlib
import html
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'assets/geography'
SOURCES = GEO / 'sources/mapwiz-world'
SOURCE_MANIFEST = SOURCES / 'water-source.json'
CONTROLS = ['Lake Superior', 'Lake Michigan', 'Lake Huron', 'Lake Erie',
            'Lake Ontario', 'Lake Victoria', 'Lake Tanganyika', 'Lake Malawi',
            'Lake Albert', 'Lake Turkana', 'Lake Chad', 'Lake Baikal',
            'Lago Titicaca', 'Vänern', 'Lake Ladoga', 'Lake Onega',
            'Lake Balkhash', 'Great Bear Lake', 'Great Slave Lake',
            'Lake Winnipeg', 'Lake Eyre North', 'Lake Eyre South']
TOLERANCE = .09  # Less than 0.6 map pixels even at maximum 6x zoom.


def sha(payload):
    return hashlib.sha256(payload).hexdigest()


def sources():
    manifest = json.loads(SOURCE_MANIFEST.read_text())
    result = {}
    for kind, record in manifest.items():
        payload = (SOURCES / record['file']).read_bytes()
        assert sha(payload) == record['sha256']
        features = json.loads(gzip.decompress(payload))['features']
        assert len(features) == record['featureCount']
        result[kind] = features
    return result


def simplify(points):
    """Ramer–Douglas–Peucker in map pixels, including closed polygon rings."""
    if len(points) <= 3:
        return points
    keep = {0, len(points)-1}
    stack = [(0, len(points)-1)]
    while stack:
        a, b = stack.pop()
        if b-a <= 1:
            continue
        ax, ay = points[a]
        dx, dy = points[b][0]-ax, points[b][1]-ay
        length = dx*dx+dy*dy
        best, index = 0, None
        for i in range(a+1, b):
            px, py = points[i][0]-ax, points[i][1]-ay
            t = max(0, min(1, (px*dx+py*dy)/length)) if length else 0
            distance = (px-t*dx)**2+(py-t*dy)**2
            if distance > best:
                best, index = distance, i
        if best > TOLERANCE*TOLERANCE:
            keep.add(index)
            stack.extend([(a, index), (index, b)])
    return [points[i] for i in sorted(keep)]


def build_hydrology(map_metadata):
    data = sources()
    width, height = map_metadata['width'], map_metadata['height']
    def mercator(lat):
        return math.log(math.tan(math.pi/4+lat*math.pi/360))
    top, bottom = mercator(map_metadata['top']), mercator(map_metadata['bottom'])
    def project(point):
        lon, lat = point[:2]
        return ((lon+180)/360*width, (top-mercator(max(-85, min(85, lat))))/(top-bottom)*height)
    def number(value):
        return f'{value:.2f}'.rstrip('0').rstrip('.')
    def line(coordinates, closed=False):
        points = simplify([project(p) for p in coordinates])
        if closed and len(points) < 4:
            points = [project(p) for p in coordinates]
        if not points:
            return ''
        return 'M'+' '.join(number(x)+','+number(y) for x,y in points)+('Z' if closed else '')
    lake_paths = []
    for feature in data['lakes']:
        geometry, props = feature['geometry'], feature['properties']
        polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
        d = ''.join(line(ring, True) for polygon in polygons for ring in polygon)
        name = html.escape(props['name'] or '', quote=True)
        intermittent = 'Playa' in (props['featurecla'] or '')
        lake_paths.append(f'<path data-lake="{name}"'+(' opacity=".48"' if intermittent else '')+f' d="{d}"/>')
    river_paths = []
    for feature in data['rivers']:
        geometry = feature['geometry']
        lines = [geometry['coordinates']] if geometry['type'] == 'LineString' else geometry['coordinates']
        river_paths.append(''.join(line(coordinates) for coordinates in lines))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" preserveAspectRatio="none">'
           '<defs><clipPath id="extent"><path d="M0 0H'+str(width)+'V'+str(height)+'H0Z"/></clipPath></defs>'
           '<g clip-path="url(#extent)" stroke-linecap="round" stroke-linejoin="round">'
           '<path fill="none" stroke="#428ead" stroke-opacity=".7" stroke-width=".48" d="'+''.join(river_paths)+'"/>'
           '<g fill="#78b9d0" stroke="#418ba7" stroke-width=".24" fill-rule="evenodd">'
           +''.join(lake_paths)+'</g></g></svg>').encode()
    name = 'water-'+sha(svg)[:12]+'.svg'
    (GEO/'mapwiz-world-map'/name).write_bytes(svg)
    names = {f['properties']['name'] for f in data['lakes']}
    assert set(CONTROLS) <= names
    return {'image': '/assets/geography/mapwiz-world-map/'+name,
            'imageSHA256': sha(svg), 'bytes': len(svg), 'gzipBytes': len(gzip.compress(svg, mtime=0)),
            'featureCount': len(data['lakes']), 'riverCount': len(data['rivers']),
            'sourceManifest': str(SOURCE_MANIFEST.relative_to(GEO)),
            'sourceManifestSHA256': sha(SOURCE_MANIFEST.read_bytes()),
            'simplificationTolerancePixels': TOLERANCE, 'checkpoints': CONTROLS}


def verify_hydrology(map_metadata):
    metadata = map_metadata['hydrology']
    assert metadata['sourceManifestSHA256'] == sha(SOURCE_MANIFEST.read_bytes())
    data = sources()
    payload = (ROOT/metadata['image'].lstrip('/')).read_bytes()
    assert sha(payload) == metadata['imageSHA256']
    assert metadata['bytes'] == len(payload) < 1_500_000
    assert metadata['gzipBytes'] == len(gzip.compress(payload, mtime=0)) < 600_000
    svg = ET.fromstring(payload)
    assert svg.attrib['viewBox'] == f"0 0 {map_metadata['width']} {map_metadata['height']}"
    lakes = svg.findall('.//{http://www.w3.org/2000/svg}path[@data-lake]')
    assert len(lakes) == metadata['featureCount'] == len(data['lakes']) == 1355
    names = {p.attrib['data-lake'] for p in lakes}
    assert set(CONTROLS) <= names
    assert metadata['checkpoints'] == CONTROLS
    assert metadata['riverCount'] == len(data['rivers']) == 194
    assert all(p.attrib['d'].startswith('M') and p.attrib['d'].endswith('Z') for p in lakes)
    print(f"PASS water: {len(lakes)} lakes, {metadata['riverCount']} principal rivers, {len(CONTROLS)} named controls; {len(payload)} bytes / {metadata['gzipBytes']} gzip")
