import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

target = r"""                <button class="archive-icon-btn" onclick="togglePanel\(event\)" title="닫기">\s*<img src="close\.svg" alt="닫기" width="18" height="18" />\s*</button>"""

replacement = """                <button class="archive-icon-btn" onclick="togglePanel(event)" title="닫기" style="background: transparent; padding: 0; box-shadow: none;">
                    <img src="close.svg" alt="닫기" style="width: 100%; height: 100%; border-radius: 8px;" />
                </button>"""

new_content = re.sub(target, replacement, content)

if new_content != content:
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched archive close button")
else:
    print("Failed to find archive close button target")
