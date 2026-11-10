"""Build the saved workflow-repair gallery and evidence manifest.

The script is deliberately tied to explicitly completed final runs. It never
picks up a failed or superseded run, and it refuses to reference a missing image.
"""
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[2] / "docs/frontend-redesign/workflow-repair"
LOGS = Path("/tmp/opencode")


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def latest_run(folder):
    pointer = ROOT / folder / "latest-run.json"
    if pointer.is_file():
        data = json.loads(pointer.read_text())
        report = ROOT / folder / data["report"]
        return report
    reports = sorted((ROOT / folder).glob("run-*/report.json"))
    if not reports:
        raise SystemExit(f"no completed run in {folder}")
    return reports[-1]


def route_run(folder):
    report_path = latest_run(folder)
    report = json.loads(report_path.read_text())
    assert report["counts"] == {"cases": 192, "captured": 192, "failed": 0}, report_path
    assert not report["fatal"] and not report["staticFailures"], report_path
    for case in report["cases"]:
        assert not case["runtimeErrors"], case["name"]
        assert not case["fixture"]["unresolved"], case["name"]
    return report_path.parent, report


dark_dir, dark = route_run("final5-routes-dark")
light_dir, light = route_run("final5-routes-light")


def image(file, label):
    path = ROOT / file
    assert path.is_file(), f"missing evidence: {file}"
    return (
        f'<figure><figcaption>{escape(label)}</figcaption>'
        f'<a href="{escape(file)}"><img loading="lazy" src="{escape(file)}" alt="{escape(label)}"></a></figure>'
    )


def section(title, entries):
    return f'<section><h2>{escape(title)}</h2><div class="pair">' + "".join(image(*entry) for entry in entries) + "</div></section>"


def route(file):
    return str((dark_dir / file).relative_to(ROOT))


def route_light(file):
    return str((light_dir / file).relative_to(ROOT))


sections = [
    section("Forums: continuous board directory and bordered thread posts", [
        (route("forum-board-1440-top.png"), "Board: Thread and Latest activity columns"),
        (route("forum-thread-1440-top.png"), "Thread: post sections with stable author, vote and action positions"),
        (route_light("forum-board-390-top.png"), "Phone board: the same information stacked"),
        ("final5-live/phone-forum-board-390.png", "Live Tailscale forum board at 390px"),
        ("final5-live/community-wall-comments-390.png", "Community wall comment card on a phone"),
        ("final5-live/community-wall-comments-1080.png", "Community wall comment card on desktop"),
    ]),
    section("Profiles: continuous dashboard with the pie chart restored", [
        (route("profile-rich-1440-top.png"), "Dashboard header, karma strip and section navigation"),
        (route("profile-rich-1440-statistics.png"), "Statistics: restored pie chart and results summary"),
        (route("profile-rich-1440-games.png"), "Recent games, setups and comments without a tab click"),
        (route("profile-rich-1440-bottom.png"), "Compact comment cards and the collection section"),
        (route("profile-rich-1440-collection.png"), "Collection: achievements, favorite roles and credits"),
        (route("profile-self-1440-top.png"), "Own profile keeps the karma vote controls"),
        ("final5-live/miniprofile-pie-1440.png", "Player popover: pie chart retained"),
    ]),
    section("Moderation split into three focused pages", [
        (route("moderation-log-1440-top.png"), "Recent actions"),
        (route("moderation-tools-1440-top.png"), "Run action"),
        (route("moderation-groups-1440-top.png"), "Staff groups"),
    ]),
    section("Shared family and homepage surfaces", [
        (route("family-leader-1440-top.png"), "Family page uses the same card surface as the homepage"),
        (route("family-leader-390-top.png"), "Family page on a phone"),
        ("final5-live/lobby-1440.png", "Lobby sidebar: Play before More; decks below Competitive and Stock market"),
    ]),
    section("Setups, hosting and detail popovers", [
        (route("setup-detail-1440-top.png"), "Setup detail: roles, description and discussion sections"),
        (route("create-setup-390-top.png"), "Phone setup creation: picker before the selected-roles summary"),
        (route("host-dialog-1440-top.png"), "Host dialog: Game and lobby, Access and options, Timing"),
        ("final5-live/setup-popover-1440.png", "Setup popover with an explicit info click target"),
    ]),
    section("Word decks and native controls", [
        ("final5-live/word-decks-1440.png", "Word deck rows align with a neutral cover placeholder"),
        (route("word-decks-390-top.png"), "Word decks on a phone"),
        (route_light("feedback-1440-top.png"), "Labeled native selects keep their labels readable"),
    ]),
    section("Game workspace preserved and top bar corrected", [
        ("final4-game/dark-live-1440x1000-chat.png", "Desktop game: centered state switcher and Leave game without Browse site"),
        ("final4-game/light-review-1024x768-chat.png", "Narrow desktop review: familiar panels and controls"),
        ("final4-game/dark-live-390x844-info-top.png", "Phone game info"),
        ("final4-game/dark-live-390x844-menu-top.png", "Phone menu: Leave game without an out-of-game link"),
    ]),
    section("Live populated local site at 390px", [
        ("final5-live/phone-play-390.png", "Games lobby with only Games and More"),
        ("final5-live/phone-forum-board-390.png", "Seeded forum data over Tailscale"),
    ]),
    section("Ban appeals focused regression", [
        ("final4-ban-appeals/LOCAL-ban-appeals-list.png", "Queue with pending cases and links"),
        ("final4-ban-appeals/LOCAL-ban-appeal-case.png", "Case with appeal, ban, reports and tally"),
    ]),
]

style = (
    "body{margin:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}"
    "main{max-width:1500px;margin:auto}a{color:#ed7c87}h1{font-size:28px}h2{font-size:22px}"
    "p{max-width:100ch;color:#bcb0b6}section{margin:32px 0}"
    ".pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}"
    "figure{margin:0;min-width:0}img{max-width:100%;max-height:1000px;object-fit:contain;"
    "object-position:top left;height:auto;border:1px solid #423a3e;box-sizing:border-box}"
    "figcaption{color:#e5bd58;margin-bottom:8px}@media(max-width:600px){body{margin:12px}.pair{grid-template-columns:1fr}}"
)

header = (
    "<h1>UltiMafia workflow repair</h1>"
    '<p><a href="https://mm-acer-desktop.tail162da2.ts.net:8443/play">Use the actual populated local site over Tailscale</a>. '
    "This gallery is saved controlled-test evidence, not a replacement for the site or a claim of user acceptance.</p>"
    "<p>Forums, profiles, moderation, families, setup/host dialogs, the lobby sidebar, word decks and the preserved game workspace. "
    "Full route inventory: 192 cases per palette; separate phone viewports; live-site captures are labeled.</p>"
    '<p><a href="VERIFICATION.md">Changes, verification and genuine limits</a> · <a href="capture-manifest.json">Hashed capture manifest</a> · <a href="results.json">Exact results</a></p>'
)

(ROOT / "index.html").write_text(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    "<title>UltiMafia workflow repair</title><style>" + style + "</style></head><body><main>"
    + header + "".join(sections) + "</main></body></html>"
)

# Save the verification output beside the evidence, and hash the images that the
# gallery actually references.
saved_logs = {}
for name, source in {
    "node-tests": "um-final5-node.log",
    "ui-architecture": "um-final5-lintui.log",
    "production-build": "um-final5-build.log",
    "scoped-lint": "um-final5-eslint.log",
    "lifecycle": "um-final-lifecycle.log",
    "competitive": "um-final2-competitive.log",
    "controls": "um-final5-controls.log",
    "game-layout": "um-final2-game.log",
    "ban-appeals": "um-final-ban.log",
    "homepage": "um-final5-homepage.log",
    "routes-dark": "um-final5-routes-dark.log",
    "routes-light": "um-final5-routes-light.log",
}.items():
    source_path = LOGS / source
    assert source_path.is_file(), source_path
    destination = ROOT / "verification-logs" / (name + ".log")
    destination.parent.mkdir(exist_ok=True)
    shutil.copyfile(source_path, destination)
    saved_logs[name] = {"path": str(destination.relative_to(ROOT)), "sha256": digest(destination)}

node = (ROOT / saved_logs["node-tests"]["path"]).read_text()
ui = (ROOT / saved_logs["ui-architecture"]["path"]).read_text()
production = (ROOT / saved_logs["production-build"]["path"]).read_text()
lifecycle = json.loads((ROOT / saved_logs["lifecycle"]["path"]).read_text())
competitive = json.loads((ROOT / saved_logs["competitive"]["path"]).read_text())
controls = (ROOT / saved_logs["controls"]["path"]).read_text()
game = json.loads((ROOT / saved_logs["game-layout"]["path"]).read_text())
ban = (ROOT / saved_logs["ban-appeals"]["path"]).read_text()
homepage = (ROOT / saved_logs["homepage"]["path"]).read_text()
lint = (ROOT / saved_logs["scoped-lint"]["path"]).read_text()

assert re.search(r"ℹ fail 0\b", node)
assert "UI architecture check passed" in ui
assert "ready   built in" in production
assert not lifecycle["errors"] and not lifecycle["failures"]
assert competitive["failed"] == [] and not competitive["errors"]
assert "57 interaction checks passed" in controls
assert game["failed"] == []
assert "36 passed, 0 failed" in ban
assert "10 homepage cases passed" in homepage
lint_counts = re.search(r"(\d+) problems \((\d+) errors, (\d+) warnings\)", lint)
assert lint_counts and int(lint_counts[2]) == 0

gallery_images = []
for line in (ROOT / "index.html").read_text().split("figure"):
    match = re.search(r'src="([^"]+)"', line)
    if match:
        gallery_images.append(match.group(1))
manifest = {
    "visualAcceptance": False,
    "note": "Selected final evidence from complete runs. Earlier failed or superseded captures remain diagnostic history.",
    "routes": {
        "dark": {"run": str(dark_dir.relative_to(ROOT)), "cases": dark["counts"]["cases"]},
        "light": {"run": str(light_dir.relative_to(ROOT)), "cases": light["counts"]["cases"]},
    },
    "images": [{"path": path, "sha256": digest(ROOT / path)} for path in gallery_images],
    "logs": saved_logs,
}
(ROOT / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

results = {
    "visualAcceptance": False,
    "routes": {"dark": dark["counts"]["cases"], "light": light["counts"]["cases"]},
    "nodeTests": {"passed": int(re.search(r"ℹ pass (\d+)", node)[1]), "failed": 0},
    "lifecycleChecks": lifecycle["passed"],
    "competitiveCases": competitive["cases"],
    "controlInteractionChecks": 57,
    "controlStates": 39,
    "gameLayoutCases": game["cases"],
    "banAppealChecks": 36,
    "homepageCases": 10,
    "lint": {"errors": int(lint_counts[2]), "warnings": int(lint_counts[3])},
    "productionBuild": "passed",
    "uiArchitecture": "passed",
    "forumData": {"categories": 2, "boards": 5, "threads": 7, "replies": 23},
    "phoneUrl": "https://mm-acer-desktop.tail162da2.ts.net:8443/play",
    "limitations": [
        "Provider sign-in requires the tailnet hostname authorized in Firebase.",
        "Authenticated hosting, trades, purchases, family administration and destructive moderation were not performed.",
        "Physical-phone keyboard/safe-area behavior and full minigame/network coverage are not verified.",
        "Tests and screenshots are evidence, not exhaustive subjective acceptance.",
    ],
}
(ROOT / "results.json").write_text(json.dumps(results, indent=2) + "\n")
print(json.dumps({"routes": results["routes"], "node": results["nodeTests"], "galleryImages": len(gallery_images)}))
