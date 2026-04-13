import requests
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

urls = [
    {'name': 'NOC Home', 'url': 'http://noc.mytechinfra.com'},
    {'name': 'Fokas Mail', 'url': 'https://mail.fokasmulia.com.my'},
    {'name': 'TechInfra Webmail', 'url': 'https://webmail.mytechinfra.com'},
    {'name': 'MyEG Webmail', 'url': 'https://webmail.myeg.com.my'},
    {'name': 'WhatsApp Web', 'url': 'https://web.whatsapp.com'},
    {'name': 'Agent Login', 'url': 'http://login2agent.pacific-orient.com'},
    {'name': 'MyCarInfo', 'url': 'http://www.mycarinfo.com.my'}
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0 Safari/537.36',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
}

for item in urls:
    name = item['name']
    url = item['url']
    try:
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(max_retries=1)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        response = session.get(url, timeout=15, headers=headers, verify=False, allow_redirects=True)
        print(f"[{name}] GET {url}: Status {response.status_code}, Length {len(response.text)}")
        
        if response.status_code >= 400:
            head_resp = session.head(url, timeout=15, headers=headers, verify=False, allow_redirects=True)
            print(f"[{name}] HEAD {url}: Status {head_resp.status_code}")
            
    except Exception as e:
        print(f"[{name}] FAILED: {type(e).__name__} - {str(e)}")
