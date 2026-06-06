CREATE TABLE IF NOT EXISTS Ksiazki (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tytul VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    kategoria ENUM('Fantastyka', 'Thriller', 'Romans', 'Sci-Fi', 'Horror', 'Dziecięca', 'Biografia', 'Reportaż', 'Historyczna', 'Przygodowa', 'Młodzieżowa', 'Powieść', 'Dramat', 'Epopeja', 'Wiersz', 'Epika', 'Inna') NOT NULL,
    stan ENUM('Nowa', 'Idealny', 'Bardzo dobry', 'Dobry', 'Dostateczny') NOT NULL,
    ilosc INT NOT NULL DEFAULT 1,
    wlasciciel VARCHAR(255) NOT NULL,
    UNIQUE(tytul, wlasciciel)
);

CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tytul VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    kategoria ENUM('Fantastyka', 'Thriller', 'Romans', 'Sci-Fi', 'Horror', 'Dziecięca', 'Biografia', 'Reportaż', 'Historyczna', 'Przygodowa', 'Młodzieżowa', 'Powieść', 'Dramat', 'Epopeja', 'Wiersz', 'Epika', 'Inna') NOT NULL,
    stan ENUM('Nowa', 'Idealny', 'Bardzo dobry', 'Dobry', 'Dostateczny') NOT NULL,
    wlasciciel VARCHAR(255) NOT NULL,
    UNIQUE(tytul, wlasciciel)
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
    opis TEXT DEFAULT NULL,
    czy_zablokowane BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS wymiany (
    id INT NOT NULL AUTO_INCREMENT,
    id_ksiazki_oferowanej INT NULL,
    id_ksiazki_zadanej INT NULL,
    tytul_oferowanej VARCHAR(255) NOT NULL,
    autor_oferowanej VARCHAR(255) NOT NULL,
    tytul_zadanej VARCHAR(255) NOT NULL,
    autor_zadanej VARCHAR(255) NOT NULL,
    login_nadawcy VARCHAR(255) NOT NULL,
    login_odbiorcy VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'oczekuje',
    data_utworzenia DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (id_ksiazki_oferowanej) REFERENCES Ksiazki(id) ON DELETE SET NULL,
    FOREIGN KEY (id_ksiazki_zadanej) REFERENCES Ksiazki(id) ON DELETE SET NULL
);
INSERT IGNORE INTO konta (login, email, haslo, typ_konta, imie, nazwisko, telefon, miasto, kod_pocztowy, opis, czy_zablokowane) VALUES
('admin', 'admin@bookexchange.pl', 'admin123', 'Moderator', 'Admin', 'Główny', '+48 555 444 333', 'Warszawa', '00-001', 'Konto administratora platformy.', FALSE),
('kamil', 'kamil@gmail.com', 'kowal123', 'Użytkownik', 'Kamil', 'Kowal', '+48 987 654 321', 'Płock', '09-400', 'Cześć! Jestem Kamil. ', FALSE),
('jacek', 'jacek@gmail.com', 'jacek123', 'Użytkownik', 'Jacek', 'Nowak', '+48 564 434 121', 'Gniezno', '05-200', 'Cześć! Jestem Jacek. ', FALSE),
('julia', 'julia@gmail.com', 'julia123', 'Użytkownik', 'Julia', 'Wiśniewska', '+48 111 222 333', 'Kraków', '30-001', 'Cześć! Jestem Julia.', FALSE);

INSERT IGNORE INTO Ksiazki (tytul, autor, kategoria, stan, ilosc, wlasciciel) VALUES
('Lalka', 'Bolesław Prus', 'Historyczna', 'Dobry', 1, 'kamil'),
('Ferdydurke', 'Witold Gombrowicz', 'Powieść', 'Bardzo dobry', 1, 'jacek'),
('Zbrodnia i kara', 'Fiodor Dostojewski', 'Powieść', 'Bardzo dobry', 1, 'julia');