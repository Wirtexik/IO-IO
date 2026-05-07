CREATE TABLE IF NOT EXISTS Ksiazki (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tytul TEXT UNIQUE,
    autor TEXT,
    kategoria TEXT,
    stan TEXT,
    ilosc INTEGER
);

INSERT OR IGNORE INTO Ksiazki (tytul, autor, kategoria, stan, ilosc) VALUES
('Władca Pierścieni', 'J.R.R. Tolkien', 'Fantastyka', 'Bardzo dobry', 1),
('Diuna', 'Frank Herbert', 'Sci-Fi', 'Dobry', 2),
('Wiedźmin', 'Andrzej Sapkowski', 'Fantastyka', 'Idealny', 1),
('Harry Potter i Kamień Filozoficzny', 'J.K. Rowling', 'Młodzieżowa', 'Dostateczny', 3);