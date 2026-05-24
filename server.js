const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
});

connection.connect((err) => {
    if (err) return console.error(err.message);

    connection.query('CREATE DATABASE IF NOT EXISTS instant_book_exchange', (err) => {
        if (err) return console.error(err.message);
        
        connection.changeUser({ database: 'instant_book_exchange' }, (err) => {
            if (err) return console.error(err.message);

            const initSql = fs.readFileSync('./init.sql', 'utf8');
            connection.query(initSql, (err) => {
                if (err) console.error(err.message);
            });
        });
    });
});

app.get('/api/test-books', (req, res) => {
    const uzytkownik = req.query.user;
    
    connection.query("SELECT * FROM Ksiazki WHERE wlasciciel = ? ORDER BY id ASC", [uzytkownik], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Sukces!", books: rows });
    });
});

app.get('/api/wishlist', (req, res) => {
    const uzytkownik = req.query.user;
    
    connection.query("SELECT * FROM wishlist WHERE wlasciciel = ? ORDER BY id ASC", [uzytkownik], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Sukces!", books: rows });
    });
});

app.post('/api/books', (req, res) => {
    const { tytul, autor, kategoria, stan, ilosc, destination, wlasciciel } = req.body;
    const isWishlist = destination === 'wishlist';
    const tableName = isWishlist ? 'wishlist' : 'Ksiazki';

    if (!wlasciciel) {
        return res.status(400).json({ error: 'Musisz być zalogowany, aby dodać książkę!' });
    }

    connection.query(`SELECT MAX(id) AS najwyzszeId FROM ${tableName}`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const noweId = (rows[0].najwyzszeId || 0) + 1;

        if (isWishlist) {
            const query = "INSERT INTO wishlist (id, tytul, autor, kategoria, stan, wlasciciel) VALUES (?, ?, ?, ?, ?, ?)";
            connection.query(query, [noweId, tytul, autor, kategoria, stan, wlasciciel], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Książka o tym tytule już istnieje w liście życzeń!' });
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "Dodano książkę do listy życzeń!" });
            });
        } else {
            const query = "INSERT INTO Ksiazki (id, tytul, autor, kategoria, stan, ilosc, wlasciciel) VALUES (?, ?, ?, ?, ?, ?, ?)";
            connection.query(query, [noweId, tytul, autor, kategoria, stan, ilosc, wlasciciel], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Książka o tym tytule już istnieje na półce!' });
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "Dodano książkę do półki ofert!" });
            });
        }
    });
});

app.delete('/api/books/:id', (req, res) => {
    const bookId = req.params.id;
    connection.query("DELETE FROM Ksiazki WHERE id = ?", [bookId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Książka została usunięta z półki!" });
    });
});

app.delete('/api/wishlist/:id', (req, res) => {
    const bookId = req.params.id;
    connection.query("DELETE FROM wishlist WHERE id = ?", [bookId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Książka została usunięta z listy życzeń!" });
    });
});

app.post('/api/register', (req, res) => {
    const { login, email, haslo } = req.body;
    const query = "INSERT INTO konta (login, email, haslo, typ_konta) VALUES (?, ?, ?, 'Użytkownik')";
    
    connection.query(query, [login, email, haslo], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Taki login lub adres e-mail jest już zajęty!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Konto zostało pomyślnie utworzone!" });
    });
});

app.post('/api/login', (req, res) => {
    const { login, haslo } = req.body;
    
    const query = "SELECT login FROM konta WHERE (login = ? OR email = ?) AND haslo = ?";
    
    connection.query(query, [login, login, haslo], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Nieprawidłowy login/e-mail lub hasło!' });
        }
        
        res.json({ success: true, login: rows[0].login });
    });
});

app.listen(PORT, () => {
    console.log(`Serwer dziala: http://localhost:${PORT}`);
});