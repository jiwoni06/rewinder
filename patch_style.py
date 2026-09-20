import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('<div class="side-style-header">Style</div>', '<div class="side-style-header">STYLE</div>')
    content = content.replace('<button id="tab-btn-styleset" class="archive-tab-btn active" onclick="switchArchiveTab(\'styleset\')">Style</button>', '<button id="tab-btn-styleset" class="archive-tab-btn active" onclick="switchArchiveTab(\'styleset\')">STYLE</button>')
    content = content.replace('<div class="category-title">Style</div>', '<div class="category-title">STYLE</div>')
    content = content.replace('<div id="info-category" class="info-tag">Style</div>', '<div id="info-category" class="info-tag">STYLE</div>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_file('/Users/user1/Desktop/rewinder/index.html')
