"""Aggregate completed correction checks; do not substitute for the live site."""
import base64
from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2] / "docs/frontend-redesign/revision-8"
LOGS = Path("/tmp/opencode")


def cases(folder):
    reports = sorted((ROOT / folder).glob("run-*/report.json"))
    report_path = reports[-1]
    report = json.loads(report_path.read_text())
    assert report["counts"]["failed"] == 0 and not report["fatal"], report_path
    return report_path, report["cases"]


def route_image(folder, name, width, position="top"):
    report, entries = cases(folder)
    entry = next(item for item in entries if item["name"] == name and item["viewport"]["width"] == width)
    return str((report.parent / next(image for image in entry["screenshots"] if image.endswith(f"-{position}.png"))).relative_to(ROOT))


def image(filename, label):
    data = base64.b64encode((ROOT / filename).read_bytes()).decode()
    return f'<figure><figcaption>{escape(label)}</figcaption><img src="data:image/png;base64,{data}" alt="{escape(label)}"></figure>'


manifest = {}
for palette in ("dark", "light"):
    report, entries = cases("settings-final-" + palette)
    manifest[palette] = {"report": str(report.relative_to(ROOT)), "cases": [{
        "name": item["name"], "width": item["viewport"]["width"], "checks": item.get("taskChecks", []),
        "images": [str((report.parent / image).relative_to(ROOT)) for image in item["screenshots"]],
    } for item in entries]}

node = (LOGS / "um-r8-node.log").read_text()
lint = (LOGS / "um-r8-lint-final.log").read_text()
results = {
    "node": {"tests": int(re.search(r"ℹ tests (\d+)", node)[1]), "failed": int(re.search(r"ℹ fail (\d+)", node)[1])},
    "settings": {palette: len(data["cases"]) for palette, data in manifest.items()},
    "homepage": json.loads((ROOT / "homepage-verified/report.json").read_text()),
    "competitive": json.loads((LOGS / "um-r8-competitive.log").read_text()),
    "lifecycle": json.loads((LOGS / "um-r8-lifecycle.log").read_text()),
    "controls": (LOGS / "um-r8-controls.log").read_text().strip(),
    "mobile": (LOGS / "um-r8-mobile.log").read_text().strip(),
    "scopedLint": re.findall(r"\d+ problems \(\d+ errors, \d+ warnings\)", lint),
    "productionBuild": "passed", "uiArchitecture": "passed", "visualAcceptance": False,
    "limitations": "Controlled fixtures, not authenticated live journeys or physical-phone testing. See VERIFICATION.md.",
}
(ROOT / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
(ROOT / "results.json").write_text(json.dumps(results, indent=2) + "\n")

sections = []
for title, before, after in [
    ("Homepage: category colors and default desktop features", "homepage-before/dark-1440-top.png", "homepage-verified/dark-1440-top.png"),
    ("Settings: clear navigation, grouped controls and appearance first", route_image("settings-before", "settings-site", 1440), route_image("settings-final-dark", "settings-site", 1440)),
    ("Settings on a phone", route_image("settings-before", "settings-profile", 390), route_image("settings-final-dark", "settings-profile", 390)),
]:
    sections.append('<section><h2>' + escape(title) + '</h2><div class="pair">' + image(before, "Before") + image(after, "After") + '</div></section>')
sections.append('<section><h2>Both homepage palettes</h2>' + image("homepage-verified/light-1440-top.png", "Light desktop") + '</section>')
style = 'body{margin:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}a{color:#ed7c87}h1{font-size:28px}h2{font-size:22px}p{max-width:100ch;color:#bcb0b6}section{margin:32px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0}img{max-width:100%;height:auto;border:1px solid #423a3e;box-sizing:border-box}figcaption{color:#e5bd58;margin-bottom:8px}@media(max-width:600px){body{margin:12px}.pair{gap:8px}}'
(ROOT / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia revision 8 corrections</title><style>' + style + '</style></head><body><main><h1>Homepage and settings corrections</h1><p>Use the <a href="https://mm-acer-desktop.tail162da2.ts.net:8443/play">actual local site over Tailscale</a> for interactive review. This is controlled-test evidence, not a replacement. Provider sign-in needs the hostname authorized in Firebase.</p><p>42 settings cases, 10 homepage cases and conservative-game regressions checked. Broader workflow redesign remains open; this is not whole-site acceptance.</p><p><a href="VERIFICATION.md">Verification, fixture differences, data safety and limits</a></p>' + ''.join(sections) + '</main></body></html>')
print(json.dumps({"settings": results["settings"], "node": results["node"], "lint": results["scopedLint"]}))
