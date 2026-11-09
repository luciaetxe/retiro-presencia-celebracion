"""Genera documentos/<nombre>.pdf (y <nombre>.png para WhatsApp / comprobar) a partir de documentos/fuente/<nombre>.html.
Uso: python documentos/fuente/pdf.py hoja-de-compromiso
"""
import pathlib
import subprocess
import sys

import pymupdf

ROOT = pathlib.Path(__file__).resolve().parents[2]
assert ROOT.name == "retiro-presencia-celebracion", ROOT
nombre = sys.argv[1]
src = ROOT / "documentos" / "fuente" / f"{nombre}.html"
pdf = ROOT / "documentos" / f"{nombre}.pdf"
png = ROOT / "documentos" / f"{nombre}.png"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                "--virtual-time-budget=4000", f"--print-to-pdf={pdf}", src.as_uri()], check=True)
doc = pymupdf.open(pdf)
print("páginas:", len(doc))
if len(doc) == 1:
    doc[0].get_pixmap(dpi=200).save(png)
else:
    for i, pag in enumerate(doc, 1):
        pag.get_pixmap(dpi=200).save(ROOT / "documentos" / f"{nombre}-{i}.png")
print("ok", pdf, png)
