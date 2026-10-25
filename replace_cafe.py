import os, sys

def replace_in_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
    new_content = content.replace('Cafe', 'Cafe').replace('cafe', 'cafe').replace('CAFE', 'CAFE')
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {path}')

for root, dirs, files in os.walk('.'):  # walk from cwd
    for name in files:
        if name.lower().endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json', '.css', '.html')):
            replace_in_file(os.path.join(root, name))
