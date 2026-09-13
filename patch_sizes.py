import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Replace export button
target1 = r"""<button class="archive-icon-btn" onclick="saveToShareableFile\(\)" title="내보내기 \(HTML\)" style="background: transparent; padding: 0; box-shadow: none;">\s*<img src="export\.svg" alt="내보내기" style="width: 100%; height: 100%; border-radius: 8px;" />\s*</button>"""
replacement1 = """<button class="archive-icon-btn" onclick="saveToShareableFile()" title="내보내기 (HTML)" style="background: transparent; padding: 0; box-shadow: none; width: 45px; height: 45px;">
                    <img src="export.svg" alt="내보내기" style="width: 45px; height: 45px;" />
                </button>"""
content = re.sub(target1, replacement1, content)

# Replace close panel button
target2 = r"""<button class="archive-icon-btn" onclick="togglePanel\(event\)" title="닫기" style="background: transparent; padding: 0; box-shadow: none;">\s*<img src="close\.svg" alt="닫기" style="width: 100%; height: 100%; border-radius: 8px;" />\s*</button>"""
replacement2 = """<button class="archive-icon-btn" onclick="togglePanel(event)" title="닫기" style="background: transparent; padding: 0; box-shadow: none; width: 45px; height: 45px;">
                    <img src="close.svg" alt="닫기" style="width: 45px; height: 45px;" />
                </button>"""
content = re.sub(target2, replacement2, content)

# Replace popup close button
target3 = r"""<button class="close-info" onclick="closeInfoPopup\(\)" style="background: transparent; padding: 0; box-shadow: none;">\s*<img src="close\.svg" alt="닫기" style="width: 100%; height: 100%; border-radius: 8px;" />\s*</button>"""
replacement3 = """<button class="close-info" onclick="closeInfoPopup()" style="background: transparent; padding: 0; box-shadow: none; width: 45px; height: 45px;">
                    <img src="close.svg" alt="닫기" style="width: 45px; height: 45px;" />
                </button>"""
content = re.sub(target3, replacement3, content)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated sizes")
