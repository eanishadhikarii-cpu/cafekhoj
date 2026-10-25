import os, sys
sys.stdout.reconfigure(encoding='utf-8')

EXCLUDE = {'node_modules', '.git', 'venv', '__pycache__', 'dist', '.venv', 'migrations', '.mypy_cache', '.pytest_cache'}

def tree(path, prefix=''):
    try:
        items = sorted(os.listdir(path))
    except PermissionError:
        return
    dirs_first = sorted(items, key=lambda x: (0 if os.path.isdir(os.path.join(path,x)) else 1, x))
    for i, name in enumerate(dirs_first):
        if name in EXCLUDE:
            continue
        full = os.path.join(path, name)
        connector = '`-- ' if i == len(dirs_first)-1 else '|-- '
        print(prefix + connector + name)
        if os.path.isdir(full):
            extension = '    ' if i == len(dirs_first)-1 else '|   '
            tree(full, prefix + extension)

root = r'c:\Users\maley\cafe khoj'
print(os.path.basename(root) + '/')
tree(root)

