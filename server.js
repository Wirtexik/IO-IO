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

connection.connect((blad) => {
    if (blad) return console.error(blad.message);

    connection.query('CREATE DATABASE IF NOT EXISTS instant_book_exchange', (bladTworzenia) => {
        if (bladTworzenia) return console.error(bladTworzenia.message);
        
        connection.changeUser({ database: 'instant_book_exchange' }, (bladZmiany) => {
            if (bladZmiany) return console.error(bladZmiany.message);

            const skryptInit = fs.readFileSync('./init.sql', 'utf8');
            connection.query(skryptInit, (bladSkryptu) => {
                if (bladSkryptu) console.error(bladSkryptu.message);
            });
        });
    });
});

app.get('/api/test-books', (req, res) => {
    const uzytkownik = req.query.user;
    const zapytanie = "SELECT * FROM Ksiazki WHERE wlasciciel = ? ORDER BY id ASC";
    
    connection.query(zapytanie, [uzytkownik], (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ status: "Sukces!", books: wiersze });
    });
});

app.get('/api/wishlist', (req, res) => {
    const uzytkownik = req.query.user;
    const zapytanie = "SELECT * FROM wishlist WHERE wlasciciel = ? ORDER BY id ASC";
    
    connection.query(zapytanie, [uzytkownik], (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ status: "Sukces!", books: wiersze });
    });
});

app.post('/api/books', (req, res) => {
    const { tytul, autor, kategoria, stan, ilosc, destination, wlasciciel } = req.body;
    const czyListaZyczen = destination === 'wishlist';
    const nazwaTabeli = czyListaZyczen ? 'wishlist' : 'Ksiazki';

    if (!wlasciciel) {
        return res.status(400).json({ error: 'Musisz być zalogowany, aby dodać książkę!' });
    }

    const zapytanieMaxId = `SELECT MAX(id) AS najwyzszeId FROM ${nazwaTabeli}`;
    connection.query(zapytanieMaxId, (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });

        const noweId = (wiersze[0].najwyzszeId || 0) + 1;

        if (czyListaZyczen) {
            const zapytanieWstaw = "INSERT INTO wishlist (id, tytul, autor, kategoria, stan, wlasciciel) VALUES (?, ?, ?, ?, ?, ?)";
            connection.query(zapytanieWstaw, [noweId, tytul, autor, kategoria, stan, wlasciciel], (bladWstawiania, wynik) => {
                if (bladWstawiania) {
                    if (bladWstawiania.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Książka o tym tytule już istnieje w liście życzeń!' });
                    return res.status(500).json({ error: bladWstawiania.message });
                }
                res.json({ message: "Dodano książkę do listy życzeń!" });
            });
        } else {
            const zapytanieWstaw = "INSERT INTO Ksiazki (id, tytul, autor, kategoria, stan, ilosc, wlasciciel) VALUES (?, ?, ?, ?, ?, ?, ?)";
            connection.query(zapytanieWstaw, [noweId, tytul, autor, kategoria, stan, ilosc, wlasciciel], (bladWstawiania, wynik) => {
                if (bladWstawiania) {
                    if (bladWstawiania.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Książka o tym tytule już istnieje na półce!' });
                    return res.status(500).json({ error: bladWstawiania.message });
                }
                res.json({ message: "Dodano książkę do półki ofert!" });
            });
        }
    });
});

app.delete('/api/books/:id', (req, res) => {
    const idKsiazki = req.params.id;
    const zapytanie = "DELETE FROM Ksiazki WHERE id = ?";
    connection.query(zapytanie, [idKsiazki], (blad, wynik) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ message: "Książka została usunięta z półki!" });
    });
});

app.delete('/api/wishlist/:id', (req, res) => {
    const idKsiazki = req.params.id;
    const zapytanie = "DELETE FROM wishlist WHERE id = ?";
    connection.query(zapytanie, [idKsiazki], (blad, wynik) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ message: "Książka została usunięta z listy życzeń!" });
    });
});

app.get('/api/auctions', (req, res) => {
    const { search, category, condition } = req.query;
    
    let zapytanie = "SELECT * FROM Ksiazki WHERE 1=1";
    const parametry = [];

    if (search) {
        zapytanie += " AND (tytul LIKE ? OR autor LIKE ?)";
        parametry.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        zapytanie += " AND kategoria = ?";
        parametry.push(category);
    }

    if (condition) {
        zapytanie += " AND stan = ?";
        parametry.push(condition);
    }

    zapytanie += " ORDER BY id DESC";

    connection.query(zapytanie, parametry, (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ books: wiersze });
    });
});

app.get('/api/random-books', (req, res) => {
    const zapytanie = "SELECT * FROM Ksiazki ORDER BY RAND() LIMIT 3";
    
    connection.query(zapytanie, (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ books: wiersze });
    });
});

app.post('/api/register', (req, res) => {
    const { login, email, haslo } = req.body;
    const zapytanie = "INSERT INTO konta (login, email, haslo, typ_konta, czy_zablokowane) VALUES (?, ?, ?, 'Użytkownik', FALSE)";
    
    connection.query(zapytanie, [login, email, haslo], (blad, wynik) => {
        if (blad) {
            if (blad.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Taki login lub adres e-mail jest już zajęty!' });
            }
            return res.status(500).json({ error: blad.message });
        }
        res.json({ message: "Konto zostało pomyślnie utworzone!" });
    });
});

app.post('/api/login', (req, res) => {
    const { login, haslo } = req.body;
    const zapytanie = "SELECT login, typ_konta, czy_zablokowane FROM konta WHERE (login = ? OR email = ?) AND haslo = ?";
    
    connection.query(zapytanie, [login, login, haslo], (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        
        if (wiersze.length === 0) {
            return res.status(400).json({ error: 'Nieprawidłowy login/e-mail lub hasło!' });
        }
        const daneUzytkownika = wiersze[0];
        if (daneUzytkownika.czy_zablokowane) {
            return res.status(403).json({ error: 'KONTO_ZABLOKOWANE' });
        }
        
        res.json({ success: true, login: daneUzytkownika.login, typ_konta: daneUzytkownika.typ_konta });
    });
});

app.get('/api/profile', (req, res) => {
    const loginKonta = req.query.user;
    
    const zapytanie = "SELECT email, imie, nazwisko, telefon, miasto, kod_pocztowy, opis FROM konta WHERE login = ?";
    connection.query(zapytanie, [loginKonta], (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        if (wiersze.length === 0) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        
        res.json(wiersze[0]);
    });
});

app.put('/api/profile', (req, res) => {
    const { login, imie, nazwisko, telefon, miasto, kod_pocztowy, opis } = req.body;
    
    const zapytanie = `
        UPDATE konta 
        SET imie = ?, nazwisko = ?, telefon = ?, miasto = ?, kod_pocztowy = ?, opis = ? 
        WHERE login = ?
    `;
    
    connection.query(zapytanie, [imie, nazwisko, telefon, miasto, kod_pocztowy, opis, login], (blad, wynik) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ message: "Dane profilu zostały zaktualizowane!" });
    });
});

app.put('/api/change-password', (req, res) => {
    const { login, stareHaslo, noweHaslo } = req.body;

    const zapytanieSprawdz = "SELECT haslo FROM konta WHERE login = ?";
    connection.query(zapytanieSprawdz, [login], (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        if (wiersze.length === 0) return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });

        if (wiersze[0].haslo !== stareHaslo) {
            return res.status(400).json({ error: 'Aktualne hasło jest nieprawidłowe!' });
        }

        const zapytanieAktualizuj = "UPDATE konta SET haslo = ? WHERE login = ?";
        connection.query(zapytanieAktualizuj, [noweHaslo, login], (bladAktualizacji, wynik) => {
            if (bladAktualizacji) return res.status(500).json({ error: bladAktualizacji.message });
            res.json({ message: "Hasło zostało pomyślnie zmienione!" });
        });
    });
});

app.delete('/api/delete-account/:user', (req, res) => {
    const loginKonta = req.params.user;

    const zapytanieKsiazki = "DELETE FROM Ksiazki WHERE wlasciciel = ?";
    connection.query(zapytanieKsiazki, [loginKonta], (blad) => {
        if (blad) return res.status(500).json({ error: blad.message });

        const zapytanieZyczenia = "DELETE FROM wishlist WHERE wlasciciel = ?";
        connection.query(zapytanieZyczenia, [loginKonta], (bladZyczen) => {
            if (bladZyczen) return res.status(500).json({ error: bladZyczen.message });

            const zapytanieKonto = "DELETE FROM konta WHERE login = ?";
            connection.query(zapytanieKonto, [loginKonta], (bladKonta) => {
                if (bladKonta) return res.status(500).json({ error: bladKonta.message });
                res.json({ message: "Konto zostało pomyślnie usunięte." });
            });
        });
    });
});
app.get('/api/admin/books', (req, res) => {
    const zapytanie = "SELECT * FROM Ksiazki ORDER BY id DESC";
    connection.query(zapytanie, (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ books: wiersze });
    });
});
app.get('/api/admin/users', (req, res) => {
    const zapytanie = "SELECT id, login, email, typ_konta, miasto, czy_zablokowane FROM konta ORDER BY id DESC";
    connection.query(zapytanie, (blad, wiersze) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ users: wiersze });
    });
});

app.put('/api/admin/toggle-block', (req, res) => {
    const { loginKonta, blokada } = req.body;
    
    const zapytanie = "UPDATE konta SET czy_zablokowane = ? WHERE login = ?";
    connection.query(zapytanie, [blokada, loginKonta], (blad, wynik) => {
        if (blad) return res.status(500).json({ error: blad.message });
        res.json({ message: blokada ? "Konto zostało zablokowane." : "Konto zostało pomyślnie odblokowane." });
    });
});

app.listen(PORT, () => {
    console.log(`Serwer dziala: http://localhost:${PORT}`);
});