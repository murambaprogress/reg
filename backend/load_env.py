import os
from pathlib import Path


def load_dotenv(path=None):
    p = Path(path or Path(__file__).with_name('.env'))
    if not p.exists():
        return
    with p.open() as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())


load_dotenv()
