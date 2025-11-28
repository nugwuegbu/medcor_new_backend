import requests
import time

time.sleep(8)

url = "http://localhost:8000/api/ai/query/"
headers = {
    "accept": "application/json",
    "Content-Type": "application/json"
}

data = {
    "question": "Who is Dr. Crayon Azu?",
    "hospital": "95acef1a-c4a5-4f24-a589-d46231697c1e"
}

print(f"Testing query: {data['question']}")
print(f"With hospital: {data['hospital']}\n")

try:
    response = requests.post(url, headers=headers, json=data, timeout=15)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")

