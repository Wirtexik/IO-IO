const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs'); 
const app = express();
const PORT = 3000;

const db = new sqlite3.Database('./baza-ksiazek.db');

const initSql = fs.readFileSync('./init.sql', 'utf8');
db.exec(initSql, (err) => {
    if (err) {
        console.error("Błąd podczas tworzenia bazy z pliku SQL:", err.message);
    } else {
        console.log("Baza danych została pomyślnie utworzona i załadowana z pliku init.sql!");
    }
});

app.use(express.static('public'));

app.get('/api/test-books', (req, res) => {
    db.all("SELECT * FROM Ksiazki", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            status: "Sukces!",
            message: "Dane pobrane prosto z bazy SQLite!",
            books: rows 
        });
    });
});

app.listen(PORT, () => {
    console.log(`Serwer działa! Otwórz w przeglądarce: http://localhost:${PORT}`);
});