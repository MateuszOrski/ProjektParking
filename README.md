# ProjektParking

## Aplikacja webowa :  System parkowania 

## Opis 

 
Aplikacja webowa do obsługi parkingu. 
Aplikację tworzą 4  kontenery : 

-Kontener z bazą danych (MySQL) 

-Kontener z serwerem backend (Node.js) 

-Kontener z serwerem frontend (React + Vite) 

-Kontener który po przesłaniu do niego zdjęcia rozpoznaje numer rejestracyjny pojazdu (Model AI w Python) 

<img width="497" height="417" alt="image" src="https://github.com/user-attachments/assets/b7055d79-1d59-4ec1-81ec-c33b3cffcae2" />

## Frontend 
Aplikacja posiada napisany frontend w React przy użyciu Vite. Za pomocą niego użytkownik może zalogować się na swoje konto, zarejestrować parkowanie oraz zapłacić za parkowanie i zakończyć sesję. 
 
Ponadto administratorzy mają dostęp do podglądu wszystkich miejsc parkingowych, ich zajętości oraz historii. Dodatkowo administrator może dodawać użytkowników, doładowywać im konto oraz kończyć ich parkowania. Administrator ma również dostęp do statystyk parkingu za dany dzień. 

Aplikacja jest w pełni responsywna. 

<img width="603" height="373" alt="image" src="https://github.com/user-attachments/assets/503cf94f-6074-4eee-883b-f9996812339a" />

<img width="602" height="359" alt="image" src="https://github.com/user-attachments/assets/2256862b-2f34-4d77-ae8d-f5defbe6d849" />

<img width="600" height="453" alt="image" src="https://github.com/user-attachments/assets/80627343-5e46-4587-8d95-c0361fc48030" />

<img width="604" height="386" alt="image" src="https://github.com/user-attachments/assets/a845fb5c-8134-4ec0-a3a8-b6bf3d54c7f2" />

<img width="551" height="480" alt="image" src="https://github.com/user-attachments/assets/f2439844-811f-4468-ab8b-cd2db1e0c692" />

<img width="604" height="445" alt="image" src="https://github.com/user-attachments/assets/ad1b91d1-168f-4947-8c34-60ba9c46dd41" />

<img width="539" height="412" alt="image" src="https://github.com/user-attachments/assets/4b335fec-b57d-406c-acaa-11049a865ce4" />

<img width="603" height="294" alt="image" src="https://github.com/user-attachments/assets/89f7999f-d55c-49b6-894d-d773c4ea242d" />

<img width="602" height="313" alt="image" src="https://github.com/user-attachments/assets/ecca4930-6985-41fa-9b38-2eea5d8ab3ad" />

## Backend 

Backend został stworzony w oparciu o node.js. W skład jego wchodzą poniższe endpointy: 

GET /api/parking-status: Pobiera status wszystkich miejsc parkingowych (wolne/zajęte) wraz z podsumowaniem. 

GET /api/spots/:user_id: Pobiera aktywne sesje parkingowe dla danego użytkownika. 

POST /api/entry: Rejestruje wjazd na parking (tworzy nową sesję z tokenem biletu). 

GET /api/get-ticket/:token: Pobiera szczegóły biletu na podstawie tokenu. 

POST /api/exit: Rejestruje wyjazd z parkingu i obciąża konto użytkownika. 

GET /api/history/:user_id (pierwsza wersja): Pobiera historię opłaconych parkowań dla użytkownika. 

GET /api/spot-history/:spot_id: Pobiera historię parkowań dla konkretnego miejsca. 

GET /api/stats: Pobiera statystyki wykorzystania miejsc parkingowych na bieżący dzień. 

POST /login: Loguje użytkownika na podstawie loginu i hasła. 

GET /api/session/:id: Pobiera szczegóły konkretnej sesji parkowania. 

GET /api/analyze-random: Analizuje losowe zdjęcie tablicy rejestracyjnej za pomocą zewnętrznego serwera. 

GET /api/calculate-price/:hours: Oblicza koszt parkowania na podstawie liczby godzin. 

GET /api/user/:id: Pobiera dane konkretnego użytkownika. 

GET /api/history/:user_id (druga wersja): Pobiera pełną historię sesji parkowania dla użytkownika. 

GET /admin/get-all-users: Pobiera listę wszystkich użytkowników (dla administratora). 

POST /admin/charge-user: Doładowuje saldo konta użytkownika (dla administratora). 

POST /admin/add-user: Dodaje nowego użytkownika do systemu (dla administratora). 

## Baza danych 

Baza danych MySQL składa się z dwóch schematów: auth_db i parking_db. 

auth_db (baza uwierzytelniania): 

Tabela users: Przechowuje dane użytkowników systemu parkowania. 

Kolumny: id (klucz główny, autoinkrementacja), login (unikalny), password, first_name, last_name, role (ADMIN lub OPERATOR), balance (saldo w PLN, domyślnie 100). 

Przykładowi użytkownicy: administrator ("admin") i operator ("operator"). 

parking_db (baza parkowania): 

Tabela spots: Definiuje miejsca parkingowe. 

Kolumny: id (klucz główny), spot_number (numer miejsca, np. "A1"), floor (piętro), is_active (czy aktywne, domyślnie TRUE). 

Wstawione 50 miejsc: 25 na piętrze 0 (A1-A25) i 25 na piętrze 1 (B1-B25). 

Tabela parking_sessions: Rejestruje sesje parkowania. 

Kolumny: id (klucz główny), spot_id (klucz obcy do spots), plate_number (numer rejestracyjny), entry_time (czas wjazdu), exit_time (czas wyjazdu), payment_token (token płatności), payment_status (UNPAID/PAID), total_cost (łączny koszt), user_id (ID użytkownika). 

Wstawione przykładowe sesje z różnymi statusami płatności i użytkownikami. 

Baza obsługuje zarządzanie użytkownikami, miejscami parkingowymi i sesjami parkowania z płatnościami. Relacje między tabelami zapewniają integralność danych. 

## AI 

AI służy do odczytywania tablic rejestracyjnych ze zdjęć nadesłanych przez serwer. Kod wykrywa tablicę na zdjęciu i odsyła nam jej numer. 

Model jest wzięty ze strony https://huggingface.co/spaces/ankandrew/fast-alpr/tree/main 
 
ale zapakowany w kontener przez co mamy go u siebie lokalnie jako mikroserwis pozwalający oddzielić logikę od serwera.







