"""Saved comparisons complement the real local site; never replace it."""
import base64
from html import escape
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "docs/frontend-redesign/revision-7"


def inventory(phase, palette):
    selected = {}
    for report in sorted((ROOT / f"routes-{phase}-{palette}").glob("run-*/report.json")):
        for case in json.loads(report.read_text())["cases"]:
            if case["status"] == "captured-baseline-not-accepted":
                selected[(case["name"], case["viewport"]["width"])] = {
                    "name": case["name"], "width": case["viewport"]["width"],
                    "report": str(report.relative_to(ROOT)),
                    "images": [str((report.parent / name).relative_to(ROOT)) for name in case["screenshots"]],
                    "taskChecks": case.get("taskChecks", []),
                }
    return list(selected.values())


manifest = {phase: {palette: inventory(phase, palette) for palette in ("dark", "light")} for phase in ("before", "after")}


def route_image(phase, palette, name, width, position="top"):
    case = next(case for case in manifest[phase][palette] if case["name"] == name and case["width"] == width)
    return next(image for image in case["images"] if image.endswith(f"-{position}.png"))


def image(path, label):
    data = base64.b64encode((ROOT / path).read_bytes()).decode()
    return f'<figure><figcaption>{escape(label)}</figcaption><img loading="lazy" src="data:image/png;base64,{data}" alt="{escape(label)}"></figure>'


def pair(title, before, after, phone=False):
    return f'<section><h2>{escape(title)}</h2><div class="pair{" phone" if phone else ""}">' + image(before, "Before") + image(after, "After") + '</div></section>'


sections = [
    pair("Competitive desktop: restore readable names and familiar controls", "competitive-before/live-dark-1440.png", "competitive-verified/live-dark-1440.png"),
    pair("Completed review: no dead clock; readable narrow desktop roster", "competitive-before/review-light-1024.png", "competitive-verified/review-light-1024.png"),
]
for title, name, palette, width in [
    ("Profile: an aligned identity and explicit destinations", "profile-rich", "dark", 1440),
    ("Profile on a phone", "profile-rich", "light", 390),
    ("Setup: identify the game, roles and Host action", "setup-detail", "light", 390),
    ("Shop: products with price, ownership and explicit purchase actions", "shop", "dark", 390),
    ("Forum: compact author/title/activity hierarchy", "forum-board", "light", 390),
    ("Thread: readable posts and discoverable Reply", "forum-thread", "light", 390),
]:
    sections.append(pair(title, route_image("before", palette, name, width), route_image("after", palette, name, width), width == 390))
sections.append('<section><h2>Profile destinations remain functional</h2><div class="pair phone">' + image(route_image("after", "light", "profile-rich", 390, "games"), "Games and setups") + image(route_image("after", "light", "profile-rich", 390, "statistics"), "Statistics") + '</div></section>')
style = 'body{background:#191719;color:#f4eef0;font:16px/1.5 system-ui;margin:0;padding:24px}main{max-width:1500px;margin:auto}a{color:#ed7c87}h1{font-size:28px}h2{font-size:22px}p{color:#bcb0b6;max-width:95ch}section{margin:32px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.phone{max-width:800px}figure{margin:0;min-width:0}figcaption{margin:0 0 8px;color:#e5bd58}img{max-width:100%;height:auto;border:1px solid #423a3e;box-sizing:border-box}@media(max-width:600px){body{padding:12px}.pair{gap:8px}}'
(ROOT / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia · revision 7</title><style>' + style + '</style></head><body><main><h1>UltiMafia · revision 7</h1><p><strong>The actual development site is at <a href="http://localhost:3001/play">localhost:3001</a>, connected to the existing local accounts and setups.</strong> This document is saved controlled-test evidence, not a substitute for using the site.</p><p>The game screen is a competitive workspace: preserve familiar structure and fix regressions conservatively. Site pages use task-specific replacements, including product cards and clear profile/setup destinations.</p><p><a href="VERIFICATION.md">Verification, data safety and remaining limits</a></p>' + ''.join(sections) + '</main></body></html>')
(ROOT / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + '\n')
rows = []
for palette, cases in manifest["after"].items():
    for case in cases:
        links = ' '.join(f'[{Path(image).stem.rsplit("-", 1)[-1]}]({image})' for image in case["images"])
        rows.append(f'| {case["name"]} | {palette} | {case["width"]} | {links} |')
(ROOT / "COVERAGE.md").write_text('# Revision 7 saved route inventory\n\nLatest successful cases, including task interactions. Failed attempts remain diagnostic-only; see VERIFICATION.md.\n\n| Route | Palette | Width | Images |\n| --- | --- | --- | --- |\n' + '\n'.join(rows) + '\n')
print({phase: {palette: len(cases) for palette, cases in palettes.items()} for phase, palettes in manifest.items()})
