CREATE TABLE IF NOT EXISTS Ksiazki (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tytul VARCHAR(255) UNIQUE NOT NULL,
    autor VARCHAR(255) NOT NULL,
    kategoria ENUM('Fantastyka', 'Thriller', 'Romans', 'Sci-Fi', 'Horror', 'Dziecięca', 'Biografia', 'Reportaż', 'Historyczna', 'Przygodowa', 'Młodzieżowa', 'Powieść', 'Dramat', 'Epopeja', 'Wiersz', 'Epika', 'Inna') NOT NULL,
    stan ENUM('Nowa', 'Idealny', 'Bardzo dobry', 'Dobry', 'Dostateczny') NOT NULL,
    ilosc INT NOT NULL DEFAULT 1,
    wlasciciel VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tytul VARCHAR(255) UNIQUE NOT NULL,
    autor VARCHAR(255) NOT NULL,
    kategoria ENUM('Fantastyka', 'Thriller', 'Romans', 'Sci-Fi', 'Horror', 'Dziecięca', 'Biografia', 'Reportaż', 'Historyczna', 'Przygodowa', 'Młodzieżowa', 'Powieść', 'Dramat', 'Epopeja', 'Wiersz', 'Epika', 'Inna') NOT NULL,
    stan ENUM('Nowa', 'Idealny', 'Bardzo dobry', 'Dobry', 'Dostateczny') NOT NULL,
    wlasciciel VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS konta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    haslo VARCHAR(255) NOT NULL,
    typ_konta ENUM('Użytkownik', 'Moderator') NOT NULL DEFAULT 'Użytkownik',
    imie VARCHAR(255) DEFAULT NULL,
    nazwisko VARCHAR(255) DEFAULT NULL,
    telefon VARCHAR(20) DEFAULT NULL,
    miasto VARCHAR(255) DEFAULT NULL,
    kod_pocztowy VARCHAR(10) DEFAULT NULL,
    opis TEXT DEFAULT NULL
);

INSERT IGNORE INTO konta (login, email, haslo, typ_konta, imie, nazwisko, telefon, miasto, kod_pocztowy, opis) VALUES
('admin', 'admin@bookexchange.pl', 'admin123', 'Moderator', 'Admin', 'Główny', '+48 555 444 333', 'Warszawa', '00-001', 'Konto administratora platformy.'),
('kamil', 'kamil@kowal.pl', 'kowal123', 'Użytkownik', 'Kamil', 'Kowal', '+48 987 654 321', 'Płock', '09-400', 'Cześć! Jestem Kamil. ');