"""Build labelled comparison galleries from saved route-review manifests.

Requires Pillow. This reads existing capture evidence only; it never opens a
browser or contacts a service. Contact sheets are labelled overview tiles, not
stitched scrolling screenshots or substitutes for original-resolution inspection.
"""
from pathlib import Path
import html
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2] / 'docs/frontend-redesign/revision-3'
runs = {}
for phase in ['before', 'after']:
    folder = ROOT / ('route-' + phase)
    manifest = json.loads((folder / 'latest-run.json').read_text())
    runs[phase] = folder / manifest['runName']

report = json.loads((runs['after'] / 'report.json').read_text())
names = list(dict.fromkeys(case['name'] for case in report['cases']))
output = ROOT / 'route-comparison'
output.mkdir(exist_ok=True)
for width in [1440, 390]:
    thumb_width = 320 if width == 1440 else 195
    thumb_height = round(thumb_width * (1000 / 1440 if width == 1440 else 844 / 390))
    for offset in range(0, len(names), 4):
        group = names[offset:offset + 4]
        sheet = Image.new('RGB', (4 * (thumb_width + 12) + 12, 2 * (thumb_height + 38) + 36), '#101724')
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 10), f'AFTER overview / {width}px / original viewport images separately framed; not acceptance', fill='white')
        for column, name in enumerate(group):
            for row, position in enumerate(['top', 'bottom']):
                x = 12 + column * (thumb_width + 12)
                y = 36 + row * (thumb_height + 38)
                draw.text((x, y), f'{name} / {position}', fill='#b5c8e4')
                filename = runs['after'] / f'{name}-{width}-{position}.png'
                if filename.exists():
                    image = Image.open(filename).convert('RGB')
                    image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
                    sheet.paste(image, (x, y + 20))
                    draw.rectangle((x, y + 20, x + image.width, y + 20 + image.height), outline='#526277')
                else:
                    draw.text((x, y + 30), 'MISSING — NOT ACCEPTED', fill='#ff9999')
        sheet.save(output / f'overview-{width}-{offset // 4 + 1:02}.png')

sections = []
for name in names:
    groups = []
    for width in [1440, 390]:
        figures = []
        for phase in ['before', 'after']:
            for position in ['top', 'bottom']:
                file = runs[phase] / f'{name}-{width}-{position}.png'
                relative = '../' + str(file.relative_to(ROOT))
                label = f'{phase.upper()} / {width}px / {position}'
                figures.append(f'<figure><figcaption>{label}</figcaption><a href="{relative}"><img loading="lazy" src="{relative}" alt="{html.escape(name)}: {label}"></a></figure>')
        groups.append(f'<h3>{width}px</h3><div class="images {"phone" if width == 390 else "desktop"}">{"".join(figures)}</div>')
    sections.append(f'<details><summary>{html.escape(name)}</summary>{"".join(groups)}</details>')
(output / 'index.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UltiMafia: route comparisons</title><style>
body{margin:0;padding:24px;background:#141820;color:#eef2f8;font:15px/1.5 system-ui}main{max-width:1500px;margin:auto}a{color:#a9cafa}summary{cursor:pointer;font-weight:650;padding:14px}details{border:1px solid #303b4c;border-radius:8px;margin:12px 0}h3{padding:0 16px}.images{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px}figure{margin:0;min-width:0}figcaption{font-size:12px;color:#b5c8e4;margin-bottom:8px}img{width:100%;height:auto;border:1px solid #526277;box-sizing:border-box}.phone{grid-template-columns:repeat(4,minmax(0,240px))}@media(max-width:800px){body{padding:12px}.images,.phone{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style></head><body><main><h1>UltiMafia: route comparisons</h1><p>Actual production screens with synthetic, local-only data. BEFORE and AFTER are separate viewport captures. Bottom images are independently scrolled, never stitched. Open an image for full resolution. Captured does not mean visually accepted: see UI-AUDIT.md and IMPLEMENTATION.md for open work and evidence limits.</p>''' + ''.join(sections) + '</main></body></html>')
print(f'Created 16 labelled overview images and {len(names)} route comparison groups: {output}')
