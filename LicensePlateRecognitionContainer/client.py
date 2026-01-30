import requests
import os

url = "http://localhost:8000/predict"
image_filename = "Cars201.png" 

if not os.path.exists(image_filename):
    print(f"BŁĄD: Nie znaleziono pliku '{image_filename}' w folderze!")
    exit()

print(f"Wysyłam plik: {image_filename}...")
try:
    with open(image_filename, "rb") as image_file:
        files = {"file": image_file}
        response = requests.post(url, files=files)

    if response.status_code == 200:
        print("SUKCES! Oto wynik z kontenera:")
        print(response.json())
    else:
        print(f"Błąd serwera (Kod {response.status_code}):")
        print(response.text)

except Exception as e:
    print(f"Błąd połączenia: {e}")
    print("Czy kontener Docker jest uruchomiony?")