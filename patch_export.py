import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

target = r"""                <button class="archive-icon-btn" onclick="saveToShareableFile\(\)" title="내보내기 \(HTML\)">\s*<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.2" stroke-linecap="round" stroke-linejoin="round">\s*<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>\s*<polyline points="16 6 12 2 8 6"></polyline>\s*<line x1="12" y1="2" x2="12" y2="15"></line>\s*</svg>\s*</button>"""

replacement = """                <button class="archive-icon-btn" onclick="saveToShareableFile()" title="내보내기 (HTML)" style="background: transparent; padding: 0; box-shadow: none;">
                    <img src="export.svg" alt="내보내기" style="width: 100%; height: 100%; border-radius: 8px;" />
                </button>"""

new_content = re.sub(target, replacement, content)

if new_content != content:
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched export button")
else:
    print("Failed to find export button target")
