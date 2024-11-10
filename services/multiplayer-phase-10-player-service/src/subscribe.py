import requests
import os
import time

def service_discovery_subscription():

    url = f'http://{os.getenv("SERVICE_DISCOVERY_HOST")}:{os.getenv("SERVICE_DISCOVERY_PORT")}/services'
    data = {
        "service-type": 2, 
        "port": os.getenv("THIS_SERVICE_PORT"),
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