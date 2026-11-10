"""Consolidate completed, immutable revision-9 captures; never imply acceptance."""
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2] / "docs/frontend-redesign/revision-9"
LOGS = Path("/tmp/opencode")


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def routes(folder, expected):
    report_path = sorted((ROOT / folder).glob("run-*/report.json"))[-1]
    report = json.loads(report_path.read_text())
    assert report["counts"] == {"cases": expected, "captured": expected, "failed": 0}, report_path
    assert not report["fatal"] and not report["staticFailures"], report_path
    entries = []
    for case in report["cases"]:
        assert not case["runtimeErrors"] and not case["fixture"]["unresolved"], case["name"]
        entries.append({
            "name": case["name"], "route": case["route"], "width": case["viewport"]["width"],
            "report": str(report_path.relative_to(ROOT)), "reportSha256": digest(report_path),
            "layoutChecks": case.get("layoutChecks", []), "taskChecks": case.get("taskChecks", []),
            "images": [{"path": str((report_path.parent / file).relative_to(ROOT)),
                        "sha256": digest(report_path.parent / file)} for file in case["screenshots"]],
        })
    return entries


manifest = {
    "visualAcceptance": False,
    "note": "Final complete route runs, not a union of passing retries. Earlier failed/intermediate captures remain diagnostic history. Phone bottoms are separate viewport images.",
    "before": routes("routes-before", 30),
    "after": {palette: routes("complete-" + palette, 114) for palette in ("dark", "light")},
    "supporting": {folder: [{"path": str(file.relative_to(ROOT)), "sha256": digest(file)}
                            for file in sorted((ROOT / folder).iterdir()) if file.suffix in (".png", ".json")]
                   for folder in ("homepage-latest", "competitive-latest", "controls-latest", "mobile-verified", "system-verified", "live-final")},
}

# Preserve the actual verification output beside the screenshots. The script is
# deliberately tied to explicitly completed checks, not whatever log is newest.
saved_logs = {}
for name, source in {
    "node": "um-r9-complete-node.log", "ui-architecture": "um-r9-complete-ui.log",
    "scoped-lint": "um-r9-complete-lint.log", "production-build": "um-r9-complete-production.log",
    "lifecycle": "um-r9-complete-lifecycle.log", "homepage": "um-r9-latest-homepage.log",
    "competitive": "um-r9-latest-competitive.log", "controls": "um-r9-latest-controls.log",
    "mobile": "um-r9-mobile.log", "design-system": "um-r9-system.log",
}.items():
    destination = ROOT / "verification-logs" / (name + ".log")
    destination.parent.mkdir(exist_ok=True)
    destination.write_text((LOGS / source).read_text())
    saved_logs[name] = {"path": str(destination.relative_to(ROOT)), "sha256": digest(destination)}

node = (ROOT / saved_logs["node"]["path"]).read_text()
lint = (ROOT / saved_logs["scoped-lint"]["path"]).read_text()
production = (ROOT / saved_logs["production-build"]["path"]).read_text()
ui = (ROOT / saved_logs["ui-architecture"]["path"]).read_text()
assert re.search(r"ℹ fail 0\b", node) and "UI architecture check passed" in ui
assert "ready   built in" in production
lint_counts = re.search(r"(\d+) problems \((\d+) errors, (\d+) warnings\)", lint)
assert lint_counts and int(lint_counts[2]) == 0
lifecycle = json.loads((ROOT / saved_logs["lifecycle"]["path"]).read_text())
assert not lifecycle["errors"] and not lifecycle["failures"]
homepage = json.loads((ROOT / "homepage-latest/report.json").read_text())
competitive = json.loads((ROOT / "competitive-latest/report.json").read_text())
controls = json.loads((ROOT / "controls-latest/controls.json").read_text())
mobile = json.loads((ROOT / "mobile-verified/report.json").read_text())
system = json.loads((ROOT / "system-verified/report.json").read_text())
assert len(homepage) == 10 and not competitive["errors"] and not controls["errors"]
assert not mobile["errors"] and not system["errors"]
results = {
    "visualAcceptance": False, "routes": {palette: len(entries) for palette, entries in manifest["after"].items()},
    "node": {"passed": int(re.search(r"ℹ pass (\d+)", node)[1]), "failed": 0},
    "homepageCases": len(homepage), "competitiveCases": len(competitive["cases"]),
    "controlInteractionChecks": controls["interactionChecks"], "lifecycleChecks": lifecycle["passed"],
    "mobileReportRecords": len(mobile["records"]), "mobileCaptureSummary": (LOGS / "um-r9-mobile.log").read_text().strip(),
    "designSystemViews": len(system["records"]),
    "lint": {"errors": int(lint_counts[2]), "warnings": int(lint_counts[3])},
    "productionBuild": "passed", "uiArchitecture": "passed", "logs": saved_logs,
    "limitations": ["Controlled fixtures are not authenticated live success.", "Physical-phone keyboard/safe-area behavior is not verified.", "Provider sign-in requires the tailnet hostname authorized in Firebase.", "Full minigame/network and every entitlement/family-leader/provider branch are not verified.", "Historical compact-reply connector failures were not claimed fixed."],
}
(ROOT / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
(ROOT / "results.json").write_text(json.dumps(results, indent=2) + "\n")


def route_image(entries, name, width, position="top"):
    case = next(case for case in entries if case["name"] == name and case["width"] == width)
    return next(image["path"] for image in case["images"] if image["path"].endswith(f"-{position}.png"))


def image(file, label):
    assert (ROOT / file).is_file(), file
    return f'<figure><figcaption>{escape(label)}</figcaption><a href="{escape(file)}"><img loading="lazy" src="{escape(file)}" alt="{escape(label)}"></a></figure>'


def pair(title, before, after):
    return f'<section><h2>{escape(title)}</h2><div class="pair">' + image(before, "Before") + image(after, "After") + '</div></section>'


sections = [pair("Homepage: consistent right-column panels, including Stamp Exchange", "../revision-8/homepage-verified/dark-1440-top.png", "homepage-latest/dark-1440-top.png")]
for title, name, width, palette in [
    ("Players: readable status rows and a separate newest-player list", "players", 1440, "dark"),
    ("Families: names, membership, applications and leader details", "families", 390, "light"),
    ("Hosting: search, collections and explicit management actions", "host", 1440, "dark"),
    ("Setup creation: name-first editor and role summary", "create-setup", 1440, "light"),
    ("Character decks: shared searchable library", "character-decks", 390, "dark"),
    ("Word decks: shared library with the correct hosting destination", "word-decks", 390, "light"),
    ("Narrow editor: no squeezed flex-row layout", "character-deck-editor", 320, "light"),
]:
    sections.append(pair(title, route_image(manifest["before"], name, width), route_image(manifest["after"][palette], name, width)))

for title, files in [
    ("Stamp offer and separately scrolled homepage bottom", [("homepage-latest/light-390-stamp-offer.png", "Keyboard-accessible offer selection"), ("homepage-latest/dark-320-bottom.png", "320px homepage bottom, separate viewport")]),
    ("Hosting and setup settings", [(route_image(manifest["after"]["light"], "host", 320, "bottom"), "320px host list bottom"), (route_image(manifest["after"]["dark"], "create-setup", 390, "settings"), "Phone setup settings, with cancellation and save payload checks")]),
    ("Profile, stocks and moderation corrections", [(route_image(manifest["after"]["dark"], "profile-minimal", 320), "Offline profile metadata on separate lines"), (route_image(manifest["after"]["dark"], "stocks", 320, "trade-dialog"), "Bounded share input and subtractive sell fees"), (route_image(manifest["after"]["light"], "stocks", 390, "trade-error"), "In-memory trade failure, controls recovered"), (route_image(manifest["after"]["dark"], "rankings", 320, "bottom"), "Readable leaderboard identities"), (route_image(manifest["after"]["light"], "admin-intake", 320, "ban-confirmation"), "Permanent-ban confirmation, cancelled without writing")]),
    ("Competitive workspace preserved", [("competitive-latest/live-dark-1440.png", "Live desktop: familiar panels, roster, transcript and controls"), ("competitive-latest/review-light-1024.png", "Completed narrow desktop review")]),
]:
    sections.append(f'<section><h2>{escape(title)}</h2><div class="pair">' + ''.join(image(file, label) for file, label in files) + '</div></section>')

style = 'body{margin:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}a{color:#ed7c87}h1{font-size:28px}h2{font-size:22px}p{max-width:100ch;color:#bcb0b6}section{margin:32px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0}img{max-width:100%;max-height:1000px;object-fit:contain;object-position:top left;height:auto;box-sizing:border-box}figcaption{color:#e5bd58;margin-bottom:8px}@media(max-width:600px){body{margin:12px}.pair{grid-template-columns:1fr}}'
(ROOT / "index.html").write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia workflow corrections</title><style>' + style + '</style></head><body><main><h1>UltiMafia workflow corrections</h1><p><a href="https://mm-acer-desktop.tail162da2.ts.net:8443/play">Use the actual populated local site over Tailscale</a>. This gallery is saved controlled-test evidence, not a replacement for the site or a claim of user acceptance.</p><p>38 routes × 3 widths × 2 palettes: 228 final cases. Separate top/bottom phone viewports, dialogs and preserved competitive-game layouts.</p><p><a href="VERIFICATION.md">Changes, verification and genuine limits</a> · <a href="COVERAGE.md">Every captured route</a> · <a href="capture-manifest.json">Hashed capture manifest</a> · <a href="results.json">Exact results</a></p>' + ''.join(sections) + '</main></body></html>')
rows = []
for palette, cases in manifest["after"].items():
    for case in cases:
        links = ' '.join(f'[{Path(image["path"]).stem}]({image["path"]})' for image in case["images"])
        rows.append(f'| {case["name"]} | {palette} | {case["width"]} | {links} |')
(ROOT / "COVERAGE.md").write_text('# Revision 9 final capture inventory\n\nAll 228 cases from two complete final runs. Passing runtime/layout/task checks are not subjective acceptance. Earlier failed or superseded captures are retained outside this final inventory.\n\n| Route | Palette | Width | Viewports and dialogs |\n| --- | --- | --- | --- |\n' + '\n'.join(rows) + '\n')
print(json.dumps({key: results[key] for key in ("routes", "node", "lint", "lifecycleChecks")}))
