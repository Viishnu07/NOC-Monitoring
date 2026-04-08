import json
import socket
import time
import requests
import urllib3
from datetime import datetime
from pathlib import Path

# Suppress InsecureRequestWarning when verify=False is used
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Paths
ROOT_DIR = Path(__file__).parent
PUBLIC_DIR = ROOT_DIR / "public"
URLS_FILE = ROOT_DIR / "urls.json"
STATUS_FILE = PUBLIC_DIR / "status.json"
HISTORY_FILE = PUBLIC_DIR / "history.json"

def check_tcp(ip, port=80, timeout=5):
    start = time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)        
        result = sock.connect_ex((ip, port))
        sock.close()
        response_time = (time.time() - start) * 1000
        return result == 0, response_time
    except Exception:
        return False, 0

def check_http(url, timeout=5):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
        response_time = response.elapsed.total_seconds() * 1000
        return response.status_code < 400, response_time
    except Exception:
        # If it failed and was explicitly http://, try https:// gracefully
        if url.startswith("http://"):
            try:
                https_url = url.replace("http://", "https://", 1)
                response = requests.get(https_url, timeout=timeout, headers=headers, verify=False, allow_redirects=True)
                response_time = response.elapsed.total_seconds() * 1000
                return response.status_code < 400, response_time
            except Exception:
                return False, 0
        return False, 0

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
            # If a URL is provided, rely strictly on the HTTP check.
            is_up, rtt = check_http(url)
        elif ip:
            # If no URL is provided but we have an IP, perform a TCP check.
            primary_ip = ip.split(',')[0].strip()
            is_up, rtt = check_tcp(primary_ip)
        else:
            is_up, rtt = False, 0
            
        results.append({
            "name": name,
            "url": url,
            "ip": ip,
            "status": "UP" if is_up else "DOWN",
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
    
    # Keep last 2000 checks (approx 1 week at 5 min intervals) for history charts
    max_history = 2000
    if len(history) > max_history:
        history = history[-max_history:]
        
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)
        
if __name__ == "__main__":
    main()
