"""Build a self-contained review from saved production-component captures."""
import base64
from html import escape
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2] / "docs/frontend-redesign"
CURRENT = ROOT / "revision-4"


def image(path, label):
    source = CURRENT / path
    encoded = base64.b64encode(source.read_bytes()).decode()
    with Image.open(source) as picture:
        width, height = picture.size
    return (f'<figure><figcaption>{escape(label)}</figcaption>'
            f'<a href="{escape(path)}"><img loading="lazy" width="{width}" height="{height}" '
            f'src="data:image/png;base64,{encoded}" alt="{escape(label)}"></a></figure>')


def pair(title, entries, phone=False, note=""):
    return (f'<section><h2>{escape(title)}</h2><p>{escape(note)}</p>'
            f'<div class="pair{" phone" if phone else ""}">' +
            "".join(image(path, label) for path, label in entries) + '</div></section>')


sections = [
    pair("1–2. Red/yellow defaults and palette-aware navigation", [
        ("system-after/lobby-dark-1440.png", "Current desktop · dark"),
        ("system-after/lobby-light-1440.png", "Current desktop · light"),
    ], note="The original wordmark, role sprites and desktop sidebar are retained. Light mode no longer has a fixed dark header/sidebar."),
    pair("3–5. Bottom phase navigation, floating composer and Fira Sans", [
        ("system-after/game-dark-390.png", "Current phone · dark · 390 × 844"),
        ("system-after/game-light-390.png", "Current phone · light · 390 × 844"),
    ], phone=True, note="Original day/night sprites. One visible clock beside the bottom phase selector. No redundant tab for a single meeting. Self-hosted Fira Sans is confirmed loaded by computed browser styles."),
    pair("Previous trial → current phone game", [
        ("../pixel-icons/controls-pixelarticons/composer-ready-390x844.png", "Before · previous blue/Pixelarticons trial"),
        ("controls-after/composer-ready-390x844.png", "After · red/yellow, original phase sprites, bottom selector"),
    ], phone=True),
    pair("History and multiple meetings", [
        ("system-after/history-light-320.png", "320px phone · history with direct Live action"),
        ("system-after/multi-meeting-light-320.png", "320px phone · two real meeting destinations"),
    ], phone=True, note="Single-meeting tabs are hidden, not meeting functionality. Drafts survive history; controlled sends after switching to Private target that meeting."),
    pair("Lobby action typography and phone scrolling", [
        ("system-after/lobby-light-390.png", "390px phone · Join/Spectate at ordinary 16px action size"),
        ("system-after/lobby-bottom-light-390.png", "Same phone · separately scrolled to the bottom"),
    ], phone=True),
    pair("6. Established icon-family comparison", [
        ("system-after/icon-comparison-dark.png", "Pixelarticons / HackerNoon regular / HackerNoon 2×"),
        ("icons-after/roles-and-utilities-390.png", "Current utility icons beside unchanged role sprites"),
    ], note="The current trial uses heavier original HackerNoon artwork, with CC BY 4.0 attribution and notices. Geometry is not hand-thickened. Pixelarticons remains available for comparison."),
    pair("7. Policy peek · production component before/after", [
        ("minigames-before/policy-peek-light-390.png", "Before · hard-coded dark dialog in light mode"),
        ("minigames-after/policy-peek-light-390.png", "After · shared theme-aware dialog and action"),
    ], phone=True),
    pair("Rules · production component before/after", [
        ("minigames-before/ratscrew-dark-390.png", "Before · bespoke rules overlay and green action"),
        ("minigames-after/ratscrew-dark-390.png", "After · shared title, scrolling body and reachable action"),
    ], phone=True),
    pair("Shared minigame decisions and fields", [
        ("minigames-after/poker-raise-light-390.png", "Poker · bounded amount, shortcuts, shared field/actions"),
        ("minigames-after/veto-light-390.png", "Veto request · required nondismissible choice"),
    ], phone=True),
    pair("Drawing toolbar · 320px before/after", [
        ("minigames-before/draw-tools-light-320.png", "Before · Clear extends past the phone edge"),
        ("minigames-after/draw-tools-light-320.png", "After · wrapping shared actions; original palette/brush sizes"),
    ], phone=True),
    pair("Drawing confirmation and keyboard-inset check", [
        ("minigames-after/draw-clear-light-320.png", "Clear canvas · shared confirmation"),
        ("system-after/keyboard-inset-simulated-light-320.png", "Simulated keyboard inset · not a physical device"),
    ], phone=True),
]

style = """
body{margin:0;padding:24px;background:#191719;color:#f4eef0;font:16px/1.5 system-ui}
main{max-width:1500px;margin:auto}h1{font-size:28px}h2{font-size:21px;margin:0 0 8px}
p{max-width:95ch;color:#bcb0b6}a{color:#ed7c87}section{margin:40px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}
.phone{max-width:820px}figure{margin:0;min-width:0}figcaption{margin:0 0 10px;color:#e5bd58}
img{display:block;max-width:100%;height:auto;border:1px solid #423a3e;box-sizing:border-box}
.notice{padding:16px;border:1px solid #423a3e;border-radius:8px}li{margin:8px 0}
@media(max-width:600px){body{padding:12px}.pair{gap:10px}figcaption{font-size:13px}}
"""
intro = """<h1>UltiMafia · revision 4 review</h1>
<p>Current local implementation of the seven requested revisions. These images use production components with controlled data, not a deployed site. Click an image for its original viewport capture.</p>
<div class="notice"><strong>Scope and verification</strong><ul>
<li>Shared tokens feed MUI and CSS; common actions, fields, typography, icons, composer and dialog frame now have documented shared APIs.</li>
<li>206 Node tests and production build passed. Core, control, design-system and minigame review checks passed. See <a href="VERIFICATION.md">verification and remaining coverage</a>.</li>
<li>Dialog/toolbar checks are not full live minigame-board coverage. Broader route baselines are archived under revision 3; they have not all been recaptured for revision 4.</li>
<li>Phone captures are Chromium viewports. Keyboard insets are simulated; physical iOS/Android behavior is not established by these captures.</li>
<li>Changes remain unstaged, uncommitted and undeployed. Original wordmark and seasonal assets are unchanged.</li>
</ul></div>"""
(CURRENT / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia revision 4</title><style>' + style + '</style></head><body><main>' + intro + ''.join(sections) + '</main></body></html>')

font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
sheet = Image.new('RGB', (828, 906), '#191719')
draw = ImageDraw.Draw(sheet)
for x, theme in [(16, "dark"), (422, "light")]:
    picture = Image.open(CURRENT / f"system-after/game-{theme}-390.png").convert("RGB")
    assert picture.size == (390, 844)
    draw.text((x, 12), f"Current · {theme}", font=font, fill='#f4eef0')
    sheet.paste(picture, (x, 46))
sheet.save(CURRENT / "game-phone-comparison.png")
print(f"Wrote current review: {CURRENT / 'index.html'}")
