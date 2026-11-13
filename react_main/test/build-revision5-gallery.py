"""Present current production captures, preserving previous revisions."""
import base64
import gzip
from html import escape
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / "docs/frontend-redesign/revision-5"

def image(path, label):
    data = (ROOT / path).read_bytes()
    return f'<figure><figcaption>{escape(label)}</figcaption><a href="{escape(path)}"><img loading="lazy" src="data:image/png;base64,{base64.b64encode(data).decode()}" alt="{escape(label)}"></a></figure>'

def pair(title, entries, phone=False, note=""):
    return f'<section><h2>{escape(title)}</h2><p>{escape(note)}</p><div class="pair{" phone" if phone else ""}">' + ''.join(image(path, label) for path, label in entries) + '</div></section>'

before = json.loads((ROOT / "startup-before/report.json").read_text())
after = json.loads((ROOT / "startup-after/report.json").read_text())
timings = '<table><thead><tr><th>Controlled optional metadata delay</th><th>Before: editor visible</th><th>After: editor visible</th></tr></thead><tbody>'
for old, new in zip(before["records"], after["records"]):
    timings += f'<tr><td>{old["optionalDelay"]}ms</td><td>{old["editorAt"]:.0f}ms</td><td>{new["editorAt"]:.0f}ms</td></tr>'
timings += '</tbody></table>'
metrics = {"before": {"bytes": 387480, "gzipBytes": 106001, "description": "Revision-4 production Game chunk containing all 16 game views; source maps inspected before edits."}}
for source_map in (REPO / "react_main/build").rglob("*.js.map"):
    source = json.loads(source_map.read_text())
    if any(name.endswith("/pages/Game/Game.jsx") for name in source.get("sources", [])):
        file = Path(str(source_map)[:-4])
        data = file.read_bytes()
        metrics["after"] = {"bytes": len(data), "gzipBytes": len(gzip.compress(data)), "file": str(file.relative_to(REPO)), "gameModules": [name for name in source["sources"] if "/pages/Game/" in name]}
assert "after" in metrics
(ROOT / "build-cost.json").write_text(json.dumps(metrics, indent=2) + '\n')

sections = [
    pair("Mafia mobile · current layout", [
        ("after/game-dark-390.png", "Dark · frequent panels at the bottom; clock/history at the top"),
        ("after/game-light-390.png", "Light · same structure and original phase sprites"),
    ], phone=True),
    pair("Previous game layout → current", [
        ("../revision-4/system-after/game-dark-390.png", "Before · crowded bottom phase/clock group"),
        ("after/game-dark-390.png", "After · independent clock, explicit View history, ordinary Chat button"),
    ], phone=True),
    pair("History and typing", [
        ("after/history-light-320.png", "320px · explicit history state and Live return"),
        ("after/typing-inset-simulated-light-320.png", "320px · unnecessary chrome hidden while typing"),
    ], phone=True, note="Keyboard insets are simulated, not a physical-device claim. Drafts survive history, menu/info and returning to Chat. The clock stays readable without covering the transcript."),
    pair("The community wall remains on the front page", [
        ("after/community-wall-comments-light-390.png", "Default Games page · populated production comment components"),
        ("after/community-wall-bottom-light-390.png", "Separately scrolled to the bottom · wall draft retained"),
    ], phone=True, note="Not hidden behind Chat or More. The game list remains above it on phones. Posting permissions, lobby aggregation and comment/reaction behavior are preserved."),
    pair("Raised primary actions", [
        ("after/lobby-raised-light.png", "Join · shared dark 3px bottom edge"),
        ("after/join-pressed-light.png", "Pressed · moves down 2px onto a 1px remaining edge"),
    ], note="The same tokens drive UiAction and existing MUI contained-primary buttons. Secondary and disabled actions stay quiet."),
    '<section><h2>HackerNoon Solid selected</h2><p>The user selected A. The application now uses original HackerNoon Solid artwork. The sidebar uses native 24px slots; curved comparison icons are not forced onto a pixel grid. Original role and phase sprites and the wordmark are unchanged.</p>' + image("after/icon-choices-light-1440.png", "Previous outline / A · HackerNoon Solid / B · Phosphor fill / C · Phosphor duotone / D · Bootstrap filled") + '<p>Comparison artwork only: HackerNoon CC BY 4.0, Phosphor MIT, Bootstrap MIT. The other candidate sets are test-only and do not enter the production bundle.</p></section>',
    '<section><h2>Less waiting, not just different spinners</h2>' + timings +
    f'<p>The production Game chunk changed from {metrics["before"]["bytes"]:,} bytes ({metrics["before"]["gzipBytes"]:,} gzip) to {metrics["after"]["bytes"]:,} bytes ({metrics["after"]["gzipBytes"]:,} gzip). Mafia no longer imports every minigame implementation. This is one chunk, not the total initial payload.</p>' +
    '<p>Actual Main/UserProvider/SiteInfoProvider/Game components, controlled 25ms essential APIs and 0/1600ms optional metadata, local assets and a fake socket. These timings are local observations, not live-server latency or a guarantee across devices. No percentage speedup is inferred from a single run.</p></section>',
    '<section><h2>One supported UI system</h2><p>Shared tokens, actions, fields/type, dialogs, icons and pending states are documented under components/ui. The architecture check rejects new direct controls, browser dialogs and alternate icon/loading imports outside that library. Existing exceptions are a frozen migration inventory, not a second supported design system.</p>' + image("after/shared-loading-light-390.png", "Shared pending state · no full-viewport animated bars; no minimum readiness delay") + '<p>See <a href="VERIFICATION.md">verification, remaining coverage and commands</a>.</p></section>',
]
style = 'body{margin:0;padding:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}h1{font-size:28px}h2{font-size:22px}p{max-width:95ch;color:#bcb0b6}a{color:#ed7c87}section{margin:36px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}.phone{max-width:820px}figure{margin:0 0 20px;min-width:0}figcaption{margin-bottom:10px;color:#e5bd58}img{max-width:100%;height:auto;border:1px solid #423a3e;box-sizing:border-box}td,th{text-align:left;padding:10px 16px;border:1px solid #423a3e}table{border-collapse:collapse} @media(max-width:600px){body{padding:12px}.pair{gap:10px}figcaption{font-size:13px}}'
(ROOT / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia revision 5</title><style>' + style + '</style></head><body><main><h1>UltiMafia · revision 5</h1><p>Current local implementation. HackerNoon Solid is selected. The community wall is restored to the default front page. No commits or deployment.</p>' + ''.join(sections) + '</main></body></html>')
print(f"Updated current gallery: {ROOT / 'index.html'}")
