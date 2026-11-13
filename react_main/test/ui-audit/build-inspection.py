#!/usr/bin/env python3
"""Build hash-deduplicated contact sheets; never mark images visually accepted."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw


def build(audits, output):
    output.mkdir(parents=True, exist_ok=False)
    selected, excluded, unique, hashes = [], [], [], set()
    for audit in audits:
        for pointer in sorted((audit / "captures").glob("*/latest-run.json")):
            report_path = pointer.parent / json.loads(pointer.read_text())["report"]
            report = json.loads(report_path.read_text())
            for case in report["cases"]:
                if (case["status"] != "captured-baseline-not-accepted" or case.get("staticFailures")
                        or case.get("runtimeErrors") or case.get("fixture", {}).get("unresolved")):
                    excluded.append({"report": str(report_path), "surface": case["name"], "width": case["viewport"]["width"], "failure": case.get("failure")})
                    continue
                for filename in case["screenshots"]:
                    path = report_path.parent / filename
                    digest = hashlib.sha256(path.read_bytes()).hexdigest()
                    item = {"path": str(path), "sha256": digest, "report": str(report_path),
                            "branch": report["branch"], "palette": report["palette"],
                            "surface": case["name"], "width": case["viewport"]["width"],
                            "label": f"{audit.name} {report['branch']} {report['palette']} {filename}"}
                    selected.append(item)
                    if digest not in hashes:
                        hashes.add(digest)
                        unique.append(item)
    if not selected:
        raise ValueError("No valid captures found; refusing an empty inspection set")
    sheets = []
    for start in range(0, len(unique), 8):
        entries = unique[start:start + 8]
        thumbnails = []
        for entry in entries:
            with Image.open(entry["path"]) as original:
                image = original.convert("RGB")
                image.thumbnail((400, 1020))
                thumbnails.append(image)
        heights = [max(image.height for image in thumbnails[index:index + 4]) + 52 for index in range(0, len(thumbnails), 4)]
        sheet = Image.new("RGB", (1640, sum(heights)), "#ddd")
        draw = ImageDraw.Draw(sheet)
        for index, (image, entry) in enumerate(zip(thumbnails, entries)):
            x, y = index % 4 * 410, sum(heights[:index // 4])
            sheet.paste(image, (x, y + 52))
            draw.text((x + 3, y + 2), entry["label"][:55], fill="#000")
            draw.text((x + 3, y + 18), entry["label"][55:110], fill="#000")
        name = f"sheet-{start // 8 + 1:03}.jpg"
        sheet.save(output / name)
        sheets.append({"file": name, "images": [entry["sha256"] for entry in entries], "inspected": False})
    manifest = {"selected": selected, "unique": unique, "sheets": sheets, "excluded": excluded,
                "visualAcceptance": False,
                "note": "Contact sheets are inspection aids, not additional coverage or stitched mobile evidence. Desktop thumbnails do not verify native-size text. Inspect original images/crops where needed; no image is automatically accepted."}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"images": len(selected), "unique": len(unique), "sheets": len(sheets), "excludedCases": len(excluded), "visualAcceptance": False}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", type=Path, action="append", required=True)
    parser.add_argument("--output", type=Path, required=True, help="New inspection directory; existing evidence is never overwritten")
    args = parser.parse_args()
    build([path.resolve() for path in args.audit], args.output.resolve())
