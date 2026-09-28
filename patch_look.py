import os

file_path = '/Users/user1/Desktop/rewinder/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make the replacements
content = content.replace('<div class="side-style-header">STYLE</div>', '<div class="side-style-header">LOOK</div>')
content = content.replace('<button id="tab-btn-styleset" class="archive-tab-btn active" onclick="switchArchiveTab(\'styleset\')">STYLE</button>', '<button id="tab-btn-styleset" class="archive-tab-btn active" onclick="switchArchiveTab(\'styleset\')">LOOK</button>')
content = content.replace('<div class="category-title">STYLE</div>', '<div class="category-title">LOOK</div>')
content = content.replace('<div id="info-category" class="info-tag">STYLE</div>', '<div id="info-category" class="info-tag">LOOK</div>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
