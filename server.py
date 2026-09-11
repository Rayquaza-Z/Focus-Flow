#!/usr/bin/env python3
"""
Zero-dependency Local HTTP Server for FocusFlow ADHD PDF Reader
Serves static assets with appropriate MIME types, CORS headers, and auto port discovery.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ADHDReaderHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        mime_types = {
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html; charset=utf-8',
            '.json': 'application/json',
            '.pdf': 'application/pdf',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.woff2': 'font/woff2',
            '.otf': 'font/otf'
        }
        ext = os.path.splitext(path)[1].lower()
        return mime_types.get(ext, super().guess_type(path))


def find_free_port(start_port=8000):
    for port in range(start_port, start_port + 50):
        try:
            with socketserver.TCPServer(("", port), ADHDReaderHTTPRequestHandler) as httpd:
                return port
        except OSError:
            continue
    return start_port


def main():
    os.chdir(DIRECTORY)
    port = find_free_port(PORT)
    server_address = ("", port)
    
    print("\n" + "=" * 65)
    print("🧠 FocusFlow — ADHD Neurodiversity PDF Reader Server")
    print("=" * 65)
    print(f"🚀 Running locally at: http://localhost:{port}")
    print(f"📂 Workspace Directory: {DIRECTORY}")
    print("✨ Features: Bionic Reading | TTS Word Sync | Brown Noise | Fidget Dock")
    print("💡 Press Ctrl+C to stop the server.")
    print("=" * 65 + "\n")

    try:
        with socketserver.TCPServer(server_address, ADHDReaderHTTPRequestHandler) as httpd:
            if "--open" in sys.argv:
                webbrowser.open(f"http://localhost:{port}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 FocusFlow Server stopped.")

if __name__ == "__main__":
    main()
