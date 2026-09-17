import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

target = r"""        <img src="Korean Fashion Archive.svg" alt="Korean Fashion Archive" style="display: block; width: 180px; height: auto; margin-bottom: 15px;">
        <svg class="title-svg-interactive" width="280" height="31" viewBox="0 0 482 53" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; height: auto;">.*?        </svg>"""

replacement = """        <img src="Korean Fashion Archive.png" alt="Korean Fashion Archive" style="display: block; width: 180px; height: auto; margin-bottom: 15px;">
        <img src="title.png" class="title-svg-interactive" alt="REWINDER" style="display: block; width: 280px; height: auto;">"""

new_content = re.sub(target, replacement, content, flags=re.DOTALL)

if new_content != content:
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched index.html with new PNG images")
else:
    print("Failed to find target in index.html")
