#!/usr/bin/env python3
"""Minimal dev server with cross-origin isolation headers for WASM pthreads."""
import http.server, functools, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))

MIME_OVERRIDES = {".wasm": "application/wasm", ".js": "application/javascript", ".mjs": "application/javascript"}

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME_OVERRIDES.get(ext, super().guess_type(path))

print(f"Serving at http://127.0.0.1:{PORT}/")
print(f"Game URL:  http://127.0.0.1:{PORT}/games/army-royale/")
http.server.HTTPServer(("", PORT), Handler).serve_forever()
