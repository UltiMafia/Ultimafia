"""Present saved captures only; never rebuild fixtures or replace raw evidence."""
import base64
from html import escape
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / "docs/frontend-redesign/revision-6"


def successful_cases(phase, palette):
    """Subset retries must not hide successful cases from the full route run."""
    cases = {}
    for report_path in sorted((ROOT / f"routes-{phase}-{palette}").glob("run-*/report.json")):
        report = json.loads(report_path.read_text())
        for case in report["cases"]:
            if case["status"] != "captured-baseline-not-accepted":
                continue
            images = [str((report_path.parent / name).relative_to(ROOT)) for name in case["screenshots"]]
            assert all((ROOT / name).is_file() for name in images)
            cases[(case["name"], case["viewport"]["width"])] = {
                "name": case["name"], "route": case["route"], "viewport": case["viewport"],
                "report": str(report_path.relative_to(ROOT)), "screenshots": images,
                "layoutChecks": case.get("layoutChecks", []),
            }
    return list(cases.values())


manifest = {phase: {palette: successful_cases(phase, palette) for palette in ("dark", "light")}
            for phase in ("before", "after")}
(ROOT / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def capture(phase, palette, name, width, position):
    case = next(case for case in manifest[phase][palette] if case["name"] == name and case["viewport"]["width"] == width)
    return next(path for path in case["screenshots"] if path.endswith(f"-{position}.png"))


def image(path, label):
    data = base64.b64encode((ROOT / path).read_bytes()).decode()
    return f'<figure><figcaption>{escape(label)}</figcaption><img loading="lazy" src="data:image/png;base64,{data}" alt="{escape(label)}"></figure>'


def comparison(title, name, palette, width, position="top", note=""):
    paths = [capture(phase, palette, name, width, position) for phase in ("before", "after")]
    return (f'<section><h2>{escape(title)}</h2><p>{escape(palette.title())} · {width}px · {escape(position)} viewport. {escape(note)}</p>'
            f'<div class="pair{" phone" if width == 390 else ""}">'
            + ''.join(image(path, label) for path, label in zip(paths, ("Before", "After"))) + '</div></section>')


sections = [
    comparison("Forums: continuous rows and visible activity", "forum-categories", "dark", 1440),
    comparison("Profiles: sections on one canvas", "profile-rich", "dark", 1440),
    comparison("Settings: headings instead of separate slabs", "settings-site", "light", 1440),
    comparison("Setup: original sprites without nested frames", "setup-detail", "dark", 1440),
    comparison("Shop: a plain product list", "shop", "light", 1440),
    comparison("Activity: content without ornamental chrome", "activity-metrics", "light", 1440,
               note="Counts and charts remain; ornamental metric cards and gradient strips are removed."),
    comparison("Phone activity: readable rows instead of clipped columns", "activity-feed", "light", 390),
    comparison("Policy: readable prose without a containing card", "rules", "light", 1440),
    comparison("Phone forums", "forum-categories", "light", 390),
    comparison("Phone discussion threads", "forum-board", "dark", 390),
    comparison("Phone thread comments", "forum-thread", "light", 390, "bottom"),
    comparison("Phone profile", "profile-rich", "light", 390),
    comparison("Phone profile: separately scrolled bottom", "profile-rich", "light", 390, "bottom"),
    comparison("Phone settings", "settings-site", "dark", 390),
    comparison("Phone setup", "setup-detail", "light", 390),
    comparison("Phone notifications", "notifications", "light", 390),
    comparison("Phone shop: separately scrolled bottom", "shop", "dark", 390, "bottom"),
    comparison("Phone policy: separately scrolled bottom", "rules", "dark", 390, "bottom"),
]
sections.append('<section><h2>Activity and custom profiles remain available</h2><p>Current phone captures, not before/after pairs. Older forum activity opens in place. Explicit profile colors remain authored content rather than being globally flattened.</p><div class="pair phone">'
                + image(capture("after", "light", "forum-categories", 390, "expanded"), "Expanded forum activity")
                + image(capture("after", "light", "profile-custom", 390, "top"), "Preserved custom background") + '</div></section>')
sections.append('<section><h2>The default community wall and mobile game remain intact</h2><div class="pair phone">'
                + image("mobile-and-wall-after/community-wall-comments-light-390.png", "Default front page · populated wall")
                + image("mobile-and-wall-after/game-dark-390.png", "Mobile game · separate corner clock and frequent bottom actions") + '</div></section>')

style = 'body{margin:0;padding:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}h1{font-size:28px}h2{font-size:22px}p{max-width:95ch;color:#bcb0b6}a{color:#ed7c87}section{margin:36px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}.phone{max-width:800px}figure{margin:0;min-width:0}figcaption{margin-bottom:10px;color:#e5bd58}img{max-width:100%;height:auto;border:1px solid #423a3e;box-sizing:border-box}@media(max-width:600px){body{padding:12px}.pair{gap:8px}figcaption{font-size:13px}}'
(ROOT / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia · continuous layouts</title><style>' + style + '</style></head><body><main><h1>UltiMafia · continuous layouts</h1><p>Revision 6 removes unnecessary cards, inset boards and repeated heading/body frames. Original game artwork, wordmarks, real game boards and user cosmetics remain. These are saved local production-component captures, not live accounts or deployment.</p><p><a href="VERIFICATION.md">Verification and limits</a> · <a href="COVERAGE.md">Complete route capture inventory</a> · <a href="../revision-5/index.html">Previous revision</a></p>' + ''.join(sections) + '</main></body></html>')

rows = []
for palette in ("dark", "light"):
    for case in manifest["after"][palette]:
        links = ' '.join(f'[{Path(path).stem.rsplit("-", 1)[-1]}]({path})' for path in case["screenshots"])
        rows.append(f'| {case["name"]} | {palette} | {case["viewport"]["width"]} | {links} | [report]({case["report"]}) |')
(ROOT / "COVERAGE.md").write_text('# Revision 6 capture inventory\n\nLatest successful case per palette/viewport, aggregated across full and subset runs. Failed attempts remain diagnostic-only in their original directories. This inventory establishes successful capture and assertions, not visual acceptance of every route. See VERIFICATION.md for the inspected sample and remaining limitations.\n\n| Route case | Palette | Width | Viewport captures | Source |\n| --- | --- | --- | --- | --- |\n' + '\n'.join(rows) + '\n')
print({phase: {palette: len(cases) for palette, cases in palettes.items()} for phase, palettes in manifest.items()})
print(f"Updated saved-capture gallery: {ROOT / 'index.html'}")
