# Raster branding assets — Dadyoom

The canonical Dadyoom visual identity retains the original deep teal, gold and
Arabic letter ض. It is **raster only in public pages**. The logo files are
`public/brand/dadyoom-logo.webp` (light backgrounds),
`public/brand/dadyoom-logo-inverse.webp` (dark backgrounds),
`public/brand/dadyoom-logo.png` (PNG fallback), and the square
`public/brand/dadyoom-icon.png`. App icons are true PNG files at their
required sizes, not mislabeled SVG content.

Rebuild using `python3 scripts/generate-dadyoom-raster.py` with Python Pillow
and an installed Noto Kufi Arabic font supporting correct shaping. Fonts are
system dependencies, **never committed**. A dedicated GitHub Actions workflow
generates the binary assets on the working branch and commits them. The website
code must not switch to image paths until those assets exist on GitHub.

Retain CSS/text fonts for accessible UI text, independent of the image files.
