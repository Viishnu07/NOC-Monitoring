import json
import time
import requests
import urllib3
import os
import concurrent.futures
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

# Suppress InsecureRequestWarning when verify=False is used
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)



# Paths
ROOT_DIR = Path(__file__).parent
# In Docker, we can override this to point to the served directory
PUBLIC_DIR = ROOT_DIR / "public"
URLS_FILE = ROOT_DIR / "urls.json"
STATUS_FILE = PUBLIC_DIR / "status.json"
HISTORY_FILE = PUBLIC_DIR / "history.json"


def check_http(url, timeout=15, bypass_status_check=False):
    """
    Checks if a URL is accessible from the monitoring server's network.

    bypass_status_check: Set True for sites known to block automated HTTP probes
    (e.g. WhatsApp Web, Google, Facebook) via TLS fingerprinting / bot-detection.
    In bypass mode, the site is considered UP if we get ANY HTTP response at all
    (even 4xx), and DOWN only on a network-level failure (Timeout, Connection Error).
    This accurately tests reachability without being fooled by anti-bot responses.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    }

    # Common keywords returned by maintenance or blocked pages
    ERROR_KEYWORDS = ["maintenance", "service unavailable", "access denied", "under construction", "oops!"]

    try:
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(max_retries=1)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        response = session.get(url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
        response_time = response.elapsed.total_seconds() * 1000

        # ── Bypass mode ──────────────────────────────────────────────────────
        # For sites that use TLS fingerprinting / bot-detection (e.g. WhatsApp Web),
        # any HTTP response means the server is reachable and the site is UP.
        # We only fail on a network-level error (connection refused, timeout, DNS).
        if bypass_status_check:
            return True, response_time, f"Reachable (HTTP {response.status_code})"

        # ── Normal mode ──────────────────────────────────────────────────────

        # 1. Check Status Code
        # Goal: "Can my users actually access and use this site right now?"
        # UP:   2xx (success), 3xx (redirect followed), 401/407 (auth-gated — server is live)
        # DOWN: 400 (bad request), 403 (forbidden), 404 (not found), 5xx (server error)
        if response.status_code in (401, 407):
            return True, response_time, "Auth Required"
        if response.status_code >= 400:
            return False, response_time, f"HTTP {response.status_code}"

        # 2. Check Content Size (ISP Splash pages are usually very light)
        # Exception: Webmail sites often return a simple <meta refresh> which can be around 70-100 bytes.
        content_len = len(response.text)
        if content_len < 50 and "refresh" not in response.text.lower():
            return False, response_time, "Empty Response"

        # 3. Check for Maintenance Keywords
        body_lower = response.text[:2000].lower()
        if any(keyword in body_lower for keyword in ERROR_KEYWORDS):
            return False, response_time, "Maintenance Page"

        # 4. Redirect Detection (Detect if hijacked by ISP domain)
        original_domain = urlparse(url).netloc
        final_domain = urlparse(response.url).netloc
        if original_domain and final_domain and original_domain != final_domain:
            if any(k in final_domain.lower() for k in ["search", "guide", "dns", "help"]):
                return False, response_time, "ISP Redirect"

        return True, response_time, "OK"

    except requests.exceptions.Timeout:
        return False, 0, "Timeout"
    except requests.exceptions.ConnectionError:
        return False, 0, "Connection Error"
    except Exception:
        return False, 0, "Request Failed"


def check_target(target, current_time):
    """Helper function to run a single target check (used in ThreadPoolExecutor)."""
    name = target.get('name')
    url = target.get('url')
    ip = target.get('ip')
    bypass = target.get('bypass_status_check', False)

    if url:
        is_up, rtt, reason = check_http(url, timeout=15, bypass_status_check=bypass)
    else:
        is_up, rtt, reason = False, 0, "No URL Defined"

    return {
        "name": name,
        "url": url,
        "ip": ip,
        "status": "UP" if is_up else "DOWN",
        "errorType": reason,
        "responseTime": round(rtt, 2),
        "timestamp": current_time
    }

def atomic_write_json(filepath, data):
    """Writes data to a temp file first, then atomically replaces the target file.
    Resolves symlinks so the real target file is updated, not the symlink itself."""
    real_path = filepath.resolve()
    temp_file = real_path.with_suffix('.tmp')
    with open(temp_file, 'w') as f:
        json.dump(data, f, indent=2)
    os.replace(temp_file, real_path)


def main():
    PUBLIC_DIR.mkdir(exist_ok=True)

    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Starting NOC monitor checks...")

    try:
        with open(URLS_FILE, 'r') as f:
            targets = json.load(f)
    except Exception as e:
        print(f"Error reading {URLS_FILE}: {e}")
        return

    current_time = datetime.utcnow().isoformat() + "Z"

    # 1. Concurrency: Check all URLs in parallel
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # executor.map guarantees the results are returned in the same order as the input 'targets' list
        results = list(executor.map(lambda t: check_target(t, current_time), targets))

    # 2. Atomic Writes: Swap files instantly at the OS level
    atomic_write_json(STATUS_FILE, results)

    history = []
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
        except Exception:
            pass

    history.append({
        "timestamp": current_time,
        "results": results
    })

    # Keep last 9000 checks (~31 days at 5-min intervals) — enough for full monthly reports
    max_history = 9000
    if len(history) > max_history:
        history = history[-max_history:]

    # Atomic write for history as well
    atomic_write_json(HISTORY_FILE, history)

    print("Checks complete. Exiting...")

if __name__ == "__main__":
    main()
