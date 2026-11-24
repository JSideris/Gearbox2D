"""Run benchmark.js in headless Chrome. Pass the directory containing both builds."""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import tempfile
import threading

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("build_dir", type=Path)
parser.add_argument("--chrome", default="google-chrome")
args = parser.parse_args()
for build in ("release", "diagnostic"):
    for mode in ("st", "mt"):
        for ext in ("js", "wasm"):
            path = args.build_dir / build / f"gearbox-module-{mode}.{ext}"
            if not path.is_file():
                parser.error(f"missing build artifact {path}")
result = {}
done = threading.Event()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *params, **kwargs):
        super().__init__(*params, directory=args.build_dir, **kwargs)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def do_GET(self):
        if self.path in ("/", "/benchmark.js"):
            page = self.path == "/"
            body = (b'<script type="module" src="/benchmark.js"></script>' if page else
                    Path(__file__).with_name("benchmark.js").read_bytes())
            self.send_response(200)
            self.send_header("Content-Type", "text/html" if page else "text/javascript")
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != "/result":
            return self.send_error(404)
        result.update(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
        self.send_response(204)
        self.end_headers()
        done.set()


with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server, tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with subprocess.Popen([args.chrome, "--headless", "--disable-background-networking",
                           "--disable-extensions", "--no-first-run", "--user-data-dir=" + profile,
                           f"http://127.0.0.1:{server.server_port}/"]) as chrome:
        try:
            if not done.wait(600):
                raise RuntimeError("Chrome did not return results within 10 minutes")
        finally:
            chrome.terminate()
if "error" in result:
    raise RuntimeError(result["error"])
print(json.dumps(result))
