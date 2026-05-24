# Pełny poradnik jak pracować na repozytorium

## Używamy Node.js + MySQL

### GitHub Desktop

## Zarządzanie wersją, klonowanie i aktualizowanie repozytorium

1. Zainstaluj program GitHub Desktop
2. W programie GitHub Desktop należy sklonować repozytorium
3. Następnie klikamy:
   `Repository -> Open in Visual Studio Code`

---

# Uruchomienie oraz wszystkie wymagane programy

## 1. Node.js

Pobierz Node.js w wersji LTS ze strony:

https://nodejs.org/

Jeśli Node.js został poprawnie zainstalowany, możesz sprawdzić wersję w terminalu Visual Studio Code:

```bash
node -v
```

---

## 2. XAMPP

XAMPP jest wymagany do poprawnego działania bazy danych MySQL i wykonywania zapytań.

### Instalacja

1. Pobierz i zainstaluj XAMPP:

https://www.apachefriends.org/pl/index.html

2. Uruchom:
   - Apache
   - MySQL

### Problem z Apache

Jeśli Apache nie chce się uruchomić, użyj komendy w CMD:

```bash
net stop w3svc
```

Następnie spróbuj ponownie uruchomić Apache.

---

## 3. Visual Studio Code

Projekt otwieramy przez GitHub Desktop:

```text
Repository -> Open in Visual Studio Code
```

### Uruchomienie projektu

Otwórz terminal w Visual Studio Code i wykonaj:

```bash
npm install
```

Następnie uruchom serwer:

```bash
node server.js
```

Po uruchomieniu strona powinna działać pod adresem:

http://localhost:3000/

Terminal stanie się konsolą serwera.

### Wyłączanie serwera

Aby wyłączyć lokalny serwer użyj:

```bash
CTRL + C
```

Ponowne uruchomienie:

```bash
node server.js
```

---
# Szybkie uruchomienie projektu

```bash
npm install
node server.js
```

Następnie otwórz:

http://localhost:3000/

# Commitowanie zmian

Jeśli chcesz zapisać swoje zmiany na GitHubie:

1. Otwórz GitHub Desktop
2. Po lewej stronie pojawią się wszystkie zmienione pliki
3. W polu na dole wpisz nazwę commita (krótki opis zmian)

4. Kliknij:

```text
Commit to main
```

5. Następnie kliknij:

```text
Push origin
```

Wtedy Twoje zmiany zostaną wysłane na GitHuba.

---

# Ważne — aktualizacja repozytorium

Jeśli ktoś inny zrobił zmiany w repozytorium, przed rozpoczęciem pracy należy wykonać:

```text
Pull origin
```

aby pobrać najnowszą wersję projektu.

Najlepiej robić `Pull origin`:
- przed rozpoczęciem pracy
- przed wysłaniem własnych commitów

W razie problemów kontakt discord: danio2308

---