import requests
from consts import THIS_SERVICE_PORT, SERVICE_DISCOVERY_PORT, SERVICE_DISCOVERY_HOST

import time

def service_discovery_subscription():
    # url = f'http://localhost:{SERVICE_DISCOVERY_PORT}/services'
    url = f'http://{SERVICE_DISCOVERY_HOST}:{SERVICE_DISCOVERY_PORT}/services'
    data = {
        "service-type": 2, 
        "port": THIS_SERVICE_PORT,
        "healthcheck-params": {
            "period": 5,
        }
    }
    print("Subscribing to service discovery")
    subscribed = None
    for i in range(2):
        try:
            response = requests.post(url, json=data)
            
            if response.status_code == 200:
                subscribed = True
                break
            else:
                print(response.text)
        except Exception as e:
            print(e)
        finally:
            time.sleep(1)
    if subscribed:
        print("Subscribed to service discovery.")
    else:
        print("Failed to subscribe to service discovery. Continuing without service discovery.")