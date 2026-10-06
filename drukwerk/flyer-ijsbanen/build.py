#!/usr/bin/env python3
"""Render the ice-rink flyer to print PDFs and PNG previews.

Needs Python Playwright with Chromium, plus pypdf:
    pip install playwright pypdf && python -m playwright install chromium

Run from anywhere:
    python3 drukwerk/flyer-ijsbanen/build.py
"""
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "flyer.html"

TRIM_MM = {"a4": (210, 297), "a5": (148, 210)}
BLEED_MM = 3
PREVIEW_DPI = 150
CSS_PX_PER_MM = 96 / 25.4
PT_PER_MM = 72 / 25.4
# The flyer page in flyer.html is 1 mm bigger than the paper (Chromium snaps
# painted boxes to whole pixels). Print on paper 2 mm bigger so it stays one
# page at 100%, then set_exact_boxes() crops it to the exact size.
PAPER_EXTRA_MM = 2

# (size, with bleed?, output file)
PDFS = [
    ("a4", True, "flyer-a4-drukker.pdf"),
    ("a5", True, "flyer-a5-drukker.pdf"),
    ("a4", False, "flyer-a4.pdf"),
    ("a5", False, "flyer-a5.pdf"),
]
PREVIEWS = [
    ("a4", "flyer-a4-voorbeeld.png"),
    ("a5", "flyer-a5-voorbeeld.png"),
]


def page_size_mm(size, bleed):
    w, h = TRIM_MM[size]
    extra = 2 * BLEED_MM if bleed else 0
    return w + extra, h + extra


def open_flyer(page, size, bleed):
    url = f"{SOURCE.as_uri()}?size={size}&bleed={1 if bleed else 0}"
    page.goto(url)
    page.wait_for_load_state("load")
    # Wait until the web fonts and every image are really decoded, otherwise
    # Chromium may print a fallback font or an empty image box.
    page.evaluate(
        """async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(img => img.decode()));
        }"""
    )
    faces = page.evaluate(
        "() => [...document.fonts].map(f => f.family.replace(/\"/g, '') + ' ' + f.weight + ' ' + f.status)"
    )
    if any(not face.endswith("loaded") for face in faces):
        raise SystemExit(f"Not every font loaded for {size}: {faces}")


def set_exact_boxes(path, size, bleed):
    """The PDF is printed on paper 2 mm too big (see PAPER_EXTRA_MM). Cut the
    page back to the exact size at the top-left corner, where the flyer
    sits, and add a TrimBox/BleedBox so a print shop's preflight sees where
    the sheet will be cut."""
    w_mm, h_mm = page_size_mm(size, bleed)
    reader = PdfReader(path)
    page = reader.pages[0]
    top = float(page.mediabox.top)
    left = float(page.mediabox.left)
    w, h = w_mm * PT_PER_MM, h_mm * PT_PER_MM
    media = RectangleObject([left, top - h, left + w, top])
    page.mediabox = media
    page.cropbox = media
    page.bleedbox = media
    inset = BLEED_MM * PT_PER_MM if bleed else 0
    page.trimbox = RectangleObject(
        [left + inset, top - h + inset, left + w - inset, top - inset]
    )
    writer = PdfWriter()
    writer.add_page(page)
    if reader.metadata:
        writer.add_metadata({k: v for k, v in reader.metadata.items()})
    with open(path, "wb") as fh:
        writer.write(fh)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        page = browser.new_page()
        page.emulate_media(media="print")
        for size, bleed, name in PDFS:
            w, h = page_size_mm(size, bleed)
            open_flyer(page, size, bleed)
            out = HERE / name
            page.pdf(
                path=str(out),
                width=f"{w + PAPER_EXTRA_MM}mm",
                height=f"{h + PAPER_EXTRA_MM}mm",
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
                print_background=True,
                prefer_css_page_size=False,
            )
            set_exact_boxes(out, size, bleed)
            print(f"{name}: {w} x {h} mm")
        page.close()

        for size, name in PREVIEWS:
            w, h = TRIM_MM[size]
            context = browser.new_context(
                viewport={
                    "width": round(w * CSS_PX_PER_MM),
                    "height": round(h * CSS_PX_PER_MM),
                },
                device_scale_factor=PREVIEW_DPI / 96,
            )
            page = context.new_page()
            page.emulate_media(media="print")
            open_flyer(page, size, False)
            page.screenshot(path=str(HERE / name), full_page=False)
            print(f"{name}: {w} x {h} mm at {PREVIEW_DPI} dpi")
            context.close()

        browser.close()


if __name__ == "__main__":
    main()
