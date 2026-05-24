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
    typ_konta ENUM('Użytkownik', 'Moderator') NOT NULL DEFAULT 'Użytkownik'
);

INSERT IGNORE INTO konta (login, email, haslo, typ_konta) VALUES
('admin', 'admin@bookexchange.pl', 'admin123', 'Moderator');