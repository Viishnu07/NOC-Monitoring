import json
import time
import requests
import urllib3
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


def check_http(url, timeout=15):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }

    # Common keywords returned by maintenance or blocked pages
    ERROR_KEYWORDS = ["maintenance", "service unavailable", "access denied", "under construction", "oops!"]

    try:
        # We use a session to handle retries and keep-alive better
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(max_retries=1)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        response = session.get(url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
        response_time = response.elapsed.total_seconds() * 1000

        # 1. Check Status Code
        # Goal: "Can my users actually access and use this site right now?"
        # UP:   2xx (success), 3xx (redirect followed), 401/407 (auth-gated — server is live, users just need credentials)
        # DOWN: 400 (bad request), 403 (forbidden — users are blocked), 404 (not found), 5xx (server error)
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
        # If the final URL's domain doesn't match the original, it might be an ISP "Help" page
        original_domain = urlparse(url).netloc
        final_domain = urlparse(response.url).netloc
        if original_domain and final_domain and original_domain != final_domain:
            # Common ISP splash keywords in domain
            if any(k in final_domain.lower() for k in ["search", "guide", "dns", "help"]):
                return False, response_time, "ISP Redirect"

        return True, response_time, "OK"

    except requests.exceptions.Timeout:
        return False, 0, "Timeout"
    except requests.exceptions.ConnectionError:
        return False, 0, "Connection Error"
    except Exception:
        return False, 0, "Request Failed"



def main():
    PUBLIC_DIR.mkdir(exist_ok=True)

    print(f"[{datetime.utcnow().isoformat() + 'Z'}] Starting NOC monitor checks...")

    try:
        with open(URLS_FILE, 'r') as f:
            targets = json.load(f)
    except Exception as e:
        print(f"Error reading {URLS_FILE}: {e}")
        return

    results = []
    current_time = datetime.utcnow().isoformat() + "Z"

    for target in targets:
        name = target.get('name')
        url = target.get('url')
        ip = target.get('ip')

        if url:
            # Strictly check via HTTP/HTTPS only.
            is_up, rtt, reason = check_http(url)
        else:
            # No URL defined — cannot check, mark as DOWN.
            is_up, rtt, reason = False, 0, "No URL Defined"

        results.append({
            "name": name,
            "url": url,
            "ip": ip,
            "status": "UP" if is_up else "DOWN",
            "errorType": reason,
            "responseTime": round(rtt, 2),
            "timestamp": current_time
        })

    with open(STATUS_FILE, 'w') as f:
        json.dump(results, f, indent=2)

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

    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

    print("Checks complete. Exiting...")

if __name__ == "__main__":
    main()
