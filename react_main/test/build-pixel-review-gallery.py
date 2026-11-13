"""Present the current saved trial. Older rejected captures remain archived."""
import base64
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2] / 'docs/frontend-redesign/pixel-icons'
ART = 'pixelarticons'
CONTROLS = 'controls-pixelarticons'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
dark = Image.open(ROOT / CONTROLS / 'composer-ready-390x844.png').convert('RGB')
light = Image.open(ROOT / CONTROLS / 'light-390.png').convert('RGB')
assert dark.size == light.size == (390, 844)
comparison = Image.new('RGB', (828, 910), '#111722')
draw = ImageDraw.Draw(comparison)
for x, picture, label in [(16, dark, 'Current: dark palette'), (422, light, 'Current: light palette')]:
    draw.text((x, 16), label, font=font, fill='#eaf1fc')
    comparison.paste(picture, (x, 50))
    draw.rectangle((x - 1, 49, x + 390, 894), outline='#526277')
comparison.save(ROOT / 'comparison-game-phone.png')

def image(file, label):
    encoded = base64.b64encode((ROOT / file).read_bytes()).decode()
    return f'<figure><figcaption>{label}</figcaption><img src="data:image/png;base64,{encoded}" alt="{label}"></figure>'

sections = [
    '<h2>Game composer · Pixelarticons, original wordmark</h2><div class="pair phone">' +
    image(f'{CONTROLS}/composer-ready-390x844.png', 'Current dark palette') +
    image(f'{CONTROLS}/light-390.png', 'Current light palette') + '</div>',
    '<h2>Lobby · current desktop and phone</h2><div class="pair">' +
    image(f'{ART}/lobby-1440.png', '1440 × 1000 viewport') + image(f'{ART}/lobby-390.png', '390 × 844 viewport') + '</div>',
    '<h2>Original role sprites with Pixelarticons</h2><div class="pair phone">' +
    image(f'{ART}/roles-and-utilities-390.png', 'Role artwork preserved') +
    image(f'{CONTROLS}/composer-whisper-390.png', 'Whisper controls') + '</div>',
    '<h2>Icon family · native size and 2×</h2>' + image(f'{ART}/icon-sheet-dark.png', 'Dark palette') +
    image(f'{ART}/icon-sheet-light.png', 'Light palette'),
]
(ROOT / 'index.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia · Pixelarticons trial</title><style>
body{margin:0;padding:24px;background:#141820;color:#eef2f8;font:15px/1.5 system-ui}main{max-width:1500px;margin:auto}p{max-width:80ch;color:#b1bfd2}h1{font-size:28px}h2{font-size:20px;margin-top:36px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.phone{max-width:800px}figure{margin:0 0 20px;min-width:0}figcaption{color:#b1bfd2;margin-bottom:8px}img{max-width:100%;height:auto;border:1px solid #3b4c63;box-sizing:border-box}@media(max-width:600px){body{padding:12px}.pair{gap:10px}}
</style></head><body><main><h1>Pixelarticons trial</h1><p>Actual unmodified SVGs from <a href="https://pixelarticons.com/free/">Pixelarticons</a> by Gerrit Halfmann, licensed MIT. Primary controls use the native 24px set, not custom approximations. The original site wordmark and seasonal artwork are unchanged, as are role sprites and uploaded media. These are synthetic desktop/phone fixtures, not a deployment or physical-device verification. Earlier custom-glyph trials are archived separately and are not the current design.</p>''' + ''.join(sections) + '</main></body></html>')
print(f'Updated current gallery, retaining rejected captures separately: {ROOT}')
