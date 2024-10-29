import random
import string
import requests

URL = "http://localhost:3000"

username = ''.join(random.choices(string.ascii_letters,
                             k=7))
password = ''.join(random.choices(string.ascii_letters, k = 8))


def test():
    response = requests.post(f"{URL}/register", json={"username": username, "password": password})
    if response.status_code != 200:
        print("Failed to register")
        return False
    response = requests.post(f"{URL}/login", json={"username": username, "password": password})
    if response.status_code != 200:
        print("Failed to login")
        return False
    token = response.json()["token"]
    response = requests.get(f"{URL}/authorization", headers={"Authorization": f"Bearer {token}"})
    if response.status_code != 200:
        print("Failed to authorize")
        return False
    response = requests.get(f"{URL}/players")
    if response.status_code != 200:
        print("Failed to get players")
        return False
    return True

if test():
    print("Test passed")
else:
    print("Test failed")
    
