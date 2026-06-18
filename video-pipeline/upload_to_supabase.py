"""Uploads finished videos + posters to the Supabase Storage bucket
`exercise-videos` and prints their public URLs.

Requires env vars (service role key is NOT in the repo):
  SUPABASE_URL          e.g. https://<project>.supabase.co
  SUPABASE_SERVICE_KEY  service role key (Storage write access)

One-time bucket setup (Supabase dashboard or SQL):
  insert into storage.buckets (id, name, public) values
    ('exercise-videos', 'exercise-videos', true);

Usage: python3 upload_to_supabase.py [output/a1.mp4 ...]   (default: all of output/)
"""

import mimetypes
import os
import sys
import urllib.request

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
BUCKET = "exercise-videos"


def upload(path, base_url, key):
    name = os.path.basename(path)
    url = f"{base_url}/storage/v1/object/{BUCKET}/{name}"
    ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": ctype,
        "x-upsert": "true",
    })
    with urllib.request.urlopen(req) as resp:
        resp.read()
    public = f"{base_url}/storage/v1/object/public/{BUCKET}/{name}"
    print(f"UPLOADED {name} -> {public}")


def main():
    base_url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not base_url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")
    files = sys.argv[1:]
    if not files:
        out_dir = os.path.join(PIPELINE_DIR, "output")
        files = [os.path.join(out_dir, f) for f in sorted(os.listdir(out_dir))
                 if f.endswith((".mp4", ".jpg"))]
    for f in files:
        upload(f, base_url.rstrip("/"), key)


if __name__ == "__main__":
    main()
