#!/usr/bin/env python3
"""Repost-article helper tools. Cross-platform, pure stdlib, zero deps.

Two subcommands:

  parse <input.json|txt> [out_prefix]
      Parse a Discourse topic JSON — the file that mcp__web-reader__webReader
      saved when pointed at https://<site>/t/topic/<id>.json. That output is
      often multi-layer JSON-escaped, so we json.loads repeatedly until we
      reach the topic dict. Prints metadata (title / author / created_at /
      category / post count / image count) and writes:
        <prefix>.html  = first post cooked HTML (use to rebuild body + image positions)
        <prefix>.imgs  = ordered <img src> URLs, one per line
      out_prefix defaults to the input basename (without extension).

  fetch <urls_file|->     (env: REFERER, UA)
      Batch-download images. Reads "<URL>|<SAVE_PATH>" lines from a file or
      stdin ("-"). Blank lines and lines starting with '#' are skipped. Sends a
      Referer header to defeat hotlink protection, reports HTTP status + byte
      size per file, and a final ok/fail tally. A file counts as OK only when
      HTTP 200 AND > 1000 bytes (so a tiny 404/forbidden body is not mistaken
      for success). Needs network — the caller should disable the Bash sandbox.

Examples:
    python3 repost.py parse /tmp/topic.json p0
    REFERER=https://linux.do/ python3 repost.py fetch - <<'EOF'
    https://cdn3.ldstatic.com/original/4X/.../hash.png|public/assets/images/2026/20260617/geo-01.png
    EOF
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

REFERER = os.environ.get("REFERER", "https://linux.do/")
UA = os.environ.get(
    "UA", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
)


# --------------------------------------------------------------------------- #
# parse
# --------------------------------------------------------------------------- #
def load_topic(path):
    raw = open(path, encoding="utf-8", errors="replace").read()
    x = raw
    for _ in range(4):  # peel off layers of JSON string-escaping
        try:
            x = json.loads(x)
        except Exception:
            break
    if isinstance(x, str):
        m = re.search(r'```(?:json)?\s*(\{.*\})\s*```', x, re.S)
        if m:
            x = json.loads(m.group(1))
    if isinstance(x, dict) and "post_stream" not in x:
        m = re.search(r'```(?:json)?\s*(\{.*\})\s*```', x.get("content", ""), re.S)
        if m:
            x = json.loads(m.group(1))
    if not isinstance(x, dict) or "post_stream" not in x:
        sys.exit("ERROR: could not find post_stream — is this a Discourse topic JSON?")
    return x


def cmd_parse(args):
    prefix = args.out_prefix or os.path.splitext(os.path.basename(args.input))[0]
    topic = load_topic(args.input)
    posts = topic["post_stream"]["posts"]
    p0 = posts[0]
    cooked = p0.get("cooked", "")
    imgs = re.findall(r'<img[^>]*src="([^"]+)"', cooked)
    meta = {
        "title": topic.get("title"),
        "author": p0.get("username"),
        "created_at": p0.get("created_at"),
        "category_id": topic.get("category_id"),
        "post_count": len(posts),
        "image_count": len(imgs),
    }
    html_path = prefix + ".html"
    imgs_path = prefix + ".imgs"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(cooked)
    with open(imgs_path, "w", encoding="utf-8") as f:
        f.write("\n".join(imgs) + "\n")
    print("metadata:")
    for k, v in meta.items():
        print(f"  {k}: {v}")
    print(f"wrote cooked HTML ({len(cooked)} chars) -> {html_path}")
    print(f"wrote {len(imgs)} image URLs -> {imgs_path}")


# --------------------------------------------------------------------------- #
# fetch
# --------------------------------------------------------------------------- #
def read_lines(source):
    if source and source != "-":
        with open(source, encoding="utf-8") as f:
            return f.read().splitlines()
    return sys.stdin.read().splitlines()


def cmd_fetch(args):
    ok = fail = 0
    for raw in read_lines(args.source):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "|" not in line:
            print(f"SKIP (no '|'): {line}")
            continue
        url, path = line.split("|", 1)
        url, path = url.strip(), path.strip()
        if not path:
            print(f"SKIP (no path): {url}")
            continue
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        req = urllib.request.Request(
            url, headers={"User-Agent": UA, "Referer": REFERER}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                status = resp.getcode()
                data = resp.read()
            with open(path, "wb") as f:
                f.write(data)
            size = len(data)
            if status == 200 and size > 1000:
                ok += 1
                print(f"OK   {path} ({size} B)")
            else:
                fail += 1
                print(f"FAIL {path} HTTP={status} sz={size} url={url}")
        except Exception as e:  # URLError / HTTPError / timeout / etc.
            fail += 1
            status = getattr(e, "code", "?")
            print(f"FAIL {path} HTTP={status} err={type(e).__name__} url={url}")
    print(f"=== {ok} ok, {fail} fail ===")


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(
        description="Repost-article helper tools (parse Discourse JSON / batch-fetch images)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_parse = sub.add_parser("parse", help="parse a Discourse topic JSON")
    p_parse.add_argument("input", help="path to the saved .json/.txt")
    p_parse.add_argument("out_prefix", nargs="?", help="output prefix (default: input basename)")
    p_parse.set_defaults(func=cmd_parse)

    p_fetch = sub.add_parser("fetch", help="batch-download images from a URL|path list")
    p_fetch.add_argument("source", help="file with 'URL|SAVE_PATH' lines, or '-' for stdin")
    p_fetch.set_defaults(func=cmd_fetch)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
