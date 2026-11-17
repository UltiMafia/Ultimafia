"""Import pinned font/icon assets as data; never execute upstream packages."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'src/components/ui'
REVISION = '5fe05c9c81a3eb43448e820b4521307102c248e7'
BASE = f'https://raw.githubusercontent.com/hackernoon/pixel-icon-library/{REVISION}/icons/SVG/'

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'UltiMafia-ui-assets'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()

def save(path, contents):
    if path.exists() and path.read_bytes() != contents:
        raise RuntimeError(f'Refusing to overwrite changed original asset: {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(contents)

allowed = {'path': {'d', 'fill-rule', 'clip-rule', 'fill'}, 'polygon': {'points', 'fill'},
           'rect': {'x', 'y', 'width', 'height', 'rx', 'ry', 'fill'},
           'circle': {'cx', 'cy', 'r', 'fill'}, 'g': {'transform', 'fill'}}
def element(node):
    tag = node.tag.split('}')[-1]
    assert tag in allowed, tag
    attrs = {}
    for key, value in node.attrib.items():
        if key in ['id', 'data-name']: continue
        assert key in allowed[tag], (tag, key)
        if key == 'fill' and value in ['#000', '#000000', 'black']: value = 'currentColor'
        if key == 'fill': assert value in ['currentColor', 'none'], value
        attrs[{'fill-rule': 'fillRule', 'clip-rule': 'clipRule'}.get(key, key)] = value
    return {'type': tag, 'attrs': attrs, 'children': [element(child) for child in node]}

mapping = json.loads((UI / 'hackernoon/source-map.json').read_text())
solid_mapping = {name: source if source.startswith('solid/') else 'solid/' + source.split('/')[1] + '-solid' for name, source in mapping.items()}
def icon(name):
    assert all(part.replace('-', '').isalnum() for part in name.split('/'))
    url = BASE + name + '.svg'
    contents = fetch(url)
    root = ET.fromstring(contents)
    assert root.attrib.get('viewBox') == '0 0 24 24', name
    return name, contents, [element(child) for child in root], url

with ThreadPoolExecutor(max_workers=6) as executor:
    icons = list(executor.map(icon, sorted(set(mapping.values()) | set(solid_mapping.values()))))
data, records = {}, []
for name, contents, elements, url in icons:
    save(UI / 'hackernoon' / (name + '.svg'), contents)
    data[name] = elements
    records.append({'name': name, 'source': url, 'sha256': hashlib.sha256(contents).hexdigest()})
notice = ('Icons from Pixel Icon Library by HackerNoon\nhttps://pixeliconlibrary.com/\n'
          'Icon artwork licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/\n'
          'Original geometry retained. Monochrome fill recolored through CSS; SVG metadata removed for React rendering.\n')
license_bytes = fetch('https://creativecommons.org/licenses/by/4.0/legalcode.txt')
assert b'Attribution' in license_bytes
save(UI / 'hackernoon/NOTICE.txt', notice.encode())
save(UI / 'hackernoon/LICENSE.txt', license_bytes)
save(ROOT / 'public/licenses/hackernoon-pixel-icons.txt', notice.encode() + b'\n' + license_bytes)
(UI / 'hackernoon/SOURCE.json').write_text(json.dumps({'library': 'HackerNoon Pixel Icon Library', 'revision': REVISION, 'license': 'CC BY 4.0', 'artworkLicenseSource': 'https://pixeliconlibrary.com/license/', 'files': records}, indent=2) + '\n')
(UI / 'hackernoon/icons.js').write_text('/*! Icons from Pixel Icon Library by HackerNoon. CC BY 4.0; see NOTICE.txt and LICENSE.txt. */\n// Generated from upstream artwork by test/import-ui-assets.py.\nexport const iconSources = ' + json.dumps(mapping, indent=2) + ';\nexport const solidIconSources = ' + json.dumps(solid_mapping, indent=2) + ';\nexport default ' + json.dumps(data, indent=2) + ';\n')

font_base = 'https://cdn.jsdelivr.net/npm/@fontsource/fira-sans@5.2.7/'
fonts = []
for weight in [400, 500, 600, 700]:
    for subset in ['latin', 'latin-ext']:
        name = f'fira-sans-{subset}-{weight}-normal.woff2'
        contents = fetch(font_base + 'files/' + name)
        assert contents[:4] == b'wOF2', name
        save(UI / 'fonts' / name, contents)
        fonts.append({'file': name, 'source': font_base + 'files/' + name, 'sha256': hashlib.sha256(contents).hexdigest()})
font_license = fetch(font_base + 'LICENSE')
assert b'SIL OPEN FONT LICENSE' in font_license
save(UI / 'fonts/OFL.txt', font_license)
save(ROOT / 'public/licenses/fira-sans.txt', font_license)
(UI / 'fonts/SOURCE.json').write_text(json.dumps({'family': 'Fira Sans', 'package': '@fontsource/fira-sans', 'version': '5.2.7', 'license': 'SIL OFL 1.1', 'files': fonts}, indent=2) + '\n')
print(f'Imported {len(icons)} original HackerNoon SVGs and {len(fonts)} self-hosted Fira Sans faces with licenses.')
