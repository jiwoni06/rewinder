import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

target = r"""                <button class="close-info" onclick="closeInfoPopup\(\)">\s*<img src="close\.svg" alt="닫기" width="24" height="24" />\s*</button>"""

replacement = """                <button class="close-info" onclick="closeInfoPopup()" style="background: transparent; padding: 0; box-shadow: none;">
                    <img src="close.svg" alt="닫기" style="width: 100%; height: 100%; border-radius: 8px;" />
                </button>"""

new_content = re.sub(target, replacement, content)

if new_content != content:
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched popup close button")
else:
    print("Failed to find popup close button target")
