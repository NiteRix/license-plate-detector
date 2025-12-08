import requests

url = "http://127.0.0.1:5000/detect"

with open("test/car1.png", "rb") as img:
    response = requests.post(url, files={"image": img})

print("STATUS:", response.status_code)
print("RAW RESPONSE:")
print(response.text)






