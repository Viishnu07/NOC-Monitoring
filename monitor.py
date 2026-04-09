import json
import time
import requests
import urllib3
import subprocess
import platform
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

# Suppress InsecureRequestWarning when verify=False is used
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Paths
ROOT_DIR = Path(__file__).parent
PUBLIC_DIR = ROOT_DIR / "public"
URLS_FILE = ROOT_DIR / "urls.json"
STATUS_FILE = PUBLIC_DIR / "status.json"
HISTORY_FILE = PUBLIC_DIR / "history.json"


def check_http(url, timeout=5):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
        
        # If it's a 4xx error (often caused by bot protection on big sites like WhatsApp), try a HEAD request
        if 400 <= response.status_code < 500:
            head_response = requests.head(url, timeout=timeout, verify=False, allow_redirects=True)
            if head_response.status_code < 400:
                response = head_response
                
        response_time = response.elapsed.total_seconds() * 1000
        return response.status_code < 400, response_time
    except Exception:
        # If it failed and was explicitly http://, try https:// gracefully
        if url.startswith("http://"):
            try:
                https_url = url.replace("http://", "https://", 1)
                response = requests.get(https_url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
                
                if 400 <= response.status_code < 500:
                    head_response = requests.head(https_url, timeout=timeout, verify=False, allow_redirects=True)
                    if head_response.status_code < 400:
                        response = head_response

                response_time = response.elapsed.total_seconds() * 1000
                return response.status_code < 400, response_time
            except Exception:
                return False, 0
        return False, 0

def run_triage(host):
    # Try mtr first
    try:
        result = subprocess.run(["mtr", "--report", "--report-cycles", "5", host], capture_output=True, text=True, timeout=60)
        if result.returncode == 0 and result.stdout:
            return result.stdout
        elif result.stdout:
            return result.stdout + f"\n(Exit code: {result.returncode})"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    except Exception:
        pass

    # Fallback to traceroute / tracert
    try:
        sys_os = platform.system().lower()
        if sys_os == "windows":
            # Windows tracert: -d (no DNS), -h (max hops), -w (timeout ms)
            cmd = ["tracert", "-d", "-h", "15", "-w", "1000", host]
        else:
            cmd = ["traceroute", "-w", "1", host]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.stdout.strip() if result.stdout else "No output from traceroute."
    except Exception as e:
        return f"Triage test failed: {str(e)}"


def main():
    PUBLIC_DIR.mkdir(exist_ok=True)
    
    with open(URLS_FILE, 'r') as f:
        targets = json.load(f)
        
    results = []
    # Local time display would be better suited for frontend, but we'll store UTC
    current_time = datetime.utcnow().isoformat() + "Z"
    
    for target in targets:
        name = target.get('name')
        url = target.get('url')
        ip = target.get('ip')
        
        if url:
            # Strictly check via HTTP/HTTPS only.
            is_up, rtt = check_http(url)
        else:
            # No URL defined — cannot check, mark as DOWN.
            is_up, rtt = False, 0
            
        triage_output = None
        if not is_up:
            host_to_check = ip if ip else (urlparse(url).hostname if url else None)
            if host_to_check:
                triage_output = run_triage(host_to_check)
                
        results.append({
            "name": name,
            "url": url,
            "ip": ip,
            "status": "UP" if is_up else "DOWN",
            "responseTime": round(rtt, 2),
            "timestamp": current_time,
            "triageOutput": triage_output
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
    
    # Keep last 2000 checks (approx 1 week at 5 min intervals) for history charts
    max_history = 2000
    if len(history) > max_history:
        history = history[-max_history:]
        
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)
        
if __name__ == "__main__":
    main()
