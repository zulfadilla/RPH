"""Hasilkan satu fail HTML lengkap (dist/RPH-Jawi.html) yang boleh dibuka terus tanpa internet."""
import pathlib, re

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf8")

def inline_js(m):
    src = (root / m.group(1)).read_text(encoding="utf8").replace("</script", "<\\/script")
    return f"<script>\n{src}\n</script>"

html = html.replace('<link rel="stylesheet" href="style.css">',
                    "<style>\n" + (root / "style.css").read_text(encoding="utf8") + "\n</style>")
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)
out = root / "dist" / "RPH-Jawi.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf8")
print(f"{out} ({out.stat().st_size // 1024} KB)")
