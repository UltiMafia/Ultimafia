"""Fetch pinned, licensed comparison artwork only; no new production default."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent / "icon-choices"
PHOSPHOR = "2b75f3ad12b420c9504ef05df8d2564a28f8500e"
BOOTSTRAP = "829d2bc2b87543c7d781c815ca4f0feee8cf9e45"
HACKERNOON = "5fe05c9c81a3eb43448e820b4521307102c248e7"
SEMANTICS = ["games", "chat", "people", "book", "rankings", "settings", "info", "check", "send", "emotes", "menu", "add", "close", "help"]
phosphor = ["game-controller", "chat-circle", "users-three", "book-open", "chart-bar", "gear-six", "info", "check-circle", "arrow-up", "smiley", "list", "plus", "x", "question"]
bootstrap = ["controller", "chat-dots-fill", "people-fill", "book-fill", "bar-chart-fill", "gear-fill", "info-circle-fill", "check-circle-fill", "arrow-up", "emoji-smile-fill", "list", "plus", "x-lg", "question-circle-fill"]
hackernoon = ["shapes", "message", "users", "book", "chart-line", "cog", "info-circle", "check-circle", "arrow-up", "face-grin", "bars", "plus", "times", "question-circle"]
families = [
    {"id": "pixel-solid", "label": "A · HackerNoon solid", "grid": 24, "license": "CC BY 4.0", "repo": "hackernoon/pixel-icon-library", "revision": HACKERNOON, "licenseUrl": "https://creativecommons.org/licenses/by/4.0/legalcode.txt", "paths": [f"icons/SVG/solid/{name}-solid.svg" for name in hackernoon]},
    *[{"id": f"phosphor-{weight}", "label": f"{'B' if weight == 'fill' else 'C'} · Phosphor {weight}", "grid": 256, "license": "MIT", "repo": "phosphor-icons/core", "revision": PHOSPHOR, "licenseUrl": f"https://raw.githubusercontent.com/phosphor-icons/core/{PHOSPHOR}/LICENSE", "paths": [f"assets/{weight}/{name}-{weight}.svg" for name in phosphor]} for weight in ["fill", "duotone"]],
    {"id": "bootstrap-fill", "label": "D · Bootstrap filled", "grid": 16, "license": "MIT", "repo": "twbs/icons", "revision": BOOTSTRAP, "licenseUrl": f"https://raw.githubusercontent.com/twbs/icons/{BOOTSTRAP}/LICENSE", "paths": [f"icons/{name}.svg" for name in bootstrap]},
]
allowed = {"path", "rect", "circle", "ellipse", "polygon", "polyline", "g"}
attrs = {"d", "x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "points", "fill", "fill-rule", "clip-rule", "opacity", "transform"}
def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "UltiMafia-icon-comparison"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()
def save(path, data):
    if path.exists() and path.read_bytes() != data:
        raise RuntimeError(f"Changed pinned asset: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
def element(node):
    tag = node.tag.split("}")[-1]
    if tag == "title": return None
    assert tag in allowed, tag
    props = {}
    for key, value in node.attrib.items():
        if key in ["id", "data-name"]: continue
        assert key in attrs, key
        if key == "fill" and value in ["#000", "#000000", "black"]: value = "currentColor"
        if key == "fill": assert value in ["none", "currentColor"], value
        props[{"fill-rule": "fillRule", "clip-rule": "clipRule"}.get(key, key)] = value
    return {"type": tag, "attrs": props, "children": [child for child in (element(n) for n in node) if child]}
def asset(task):
    family, name, source = task
    url = f"https://raw.githubusercontent.com/{family['repo']}/{family['revision']}/{source}"
    data = fetch(url)
    root = ET.fromstring(data)
    assert root.attrib["viewBox"] == f"0 0 {family['grid']} {family['grid']}"
    return family["id"], name, source, url, data, [child for child in (element(n) for n in root) if child]
with ThreadPoolExecutor(max_workers=6) as executor:
    assets = list(executor.map(asset, [(family, name, source) for family in families for name, source in zip(SEMANTICS, family["paths"])]))
manifest, result = [], []
for family in families:
    notice = fetch(family["licenseUrl"])
    assert b"MIT" in notice or b"Attribution" in notice
    save(ROOT / family["id"] / "LICENSE.txt", notice)
    icons = {}
    for identifier, name, source, url, data, elements in assets:
        if identifier != family["id"]: continue
        save(ROOT / identifier / (name + ".svg"), data)
        manifest.append({"family": identifier, "name": name, "source": url, "sha256": hashlib.sha256(data).hexdigest()})
        icons[name] = {"source": source, "elements": elements}
    result.append({key: value for key, value in family.items() if key != "paths"} | {"icons": icons})
(ROOT / "SOURCE.json").write_text(json.dumps(manifest, indent=2) + "\n")
(ROOT / "families.js").write_text("// Generated from pinned original SVGs by test/import-icon-choices.py.\nexport const iconChoices = " + json.dumps(result, indent=2) + ";\n")
print(f"Imported {len(assets)} original comparison icons with notices; production default unchanged.")
