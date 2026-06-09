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
	multipleStatements: true,
});

connection.connect((blad) => {
	if (blad) return console.error(blad.message);

	connection.query(
		'CREATE DATABASE IF NOT EXISTS instant_book_exchange',
		(bladTworzenia) => {
			if (bladTworzenia) return console.error(bladTworzenia.message);

			connection.changeUser(
				{ database: 'instant_book_exchange' },
				(bladZmiany) => {
					if (bladZmiany) return console.error(bladZmiany.message);

					const skryptInit = fs.readFileSync('./init.sql', 'utf8');
					connection.query(skryptInit, (bladSkryptu) => {
						if (bladSkryptu) console.error(bladSkryptu.message);
					});
				},
			);
		},
	);
});

app.get('/api/test-books', (req, res) => {
	const uzytkownik = req.query.user;
	const zapytanie =
		'SELECT * FROM Ksiazki WHERE wlasciciel = ? ORDER BY id ASC';

	connection.query(zapytanie, [uzytkownik], (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ status: 'Sukces!', books: wiersze });
	});
});

app.get('/api/wishlist', (req, res) => {
	const uzytkownik = req.query.user;
	const zapytanie =
		'SELECT * FROM wishlist WHERE wlasciciel = ? ORDER BY id ASC';

	connection.query(zapytanie, [uzytkownik], (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ status: 'Sukces!', books: wiersze });
	});
});

app.post('/api/books', (req, res) => {
	const { tytul, autor, kategoria, stan, destination, wlasciciel } = req.body;
	const czyListaZyczen = destination === 'wishlist';
	const nazwaTabeli = czyListaZyczen ? 'wishlist' : 'Ksiazki';

	if (!wlasciciel) {
		return res
			.status(400)
			.json({ error: 'Musisz być zalogowany, aby dodać książkę!' });
	}

	const zapytanieMaxId = `SELECT MAX(id) AS najwyzszeId FROM ${nazwaTabeli}`;
	connection.query(zapytanieMaxId, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });

		const noweId = (wiersze[0].najwyzszeId || 0) + 1;

		if (czyListaZyczen) {
			const zapytanieWstaw =
				'INSERT INTO wishlist (id, tytul, autor, kategoria, stan, wlasciciel) VALUES (?, ?, ?, ?, ?, ?)';
			connection.query(
				zapytanieWstaw,
				[noweId, tytul, autor, kategoria, stan, wlasciciel],
				(bladWstawiania, wynik) => {
					if (bladWstawiania) {
						if (bladWstawiania.code === 'ER_DUP_ENTRY')
							return res.status(400).json({
								error: 'Książka o tym tytule już istnieje w liście życzeń!',
							});
						return res.status(500).json({ error: bladWstawiania.message });
					}
					res.json({ message: 'Dodano książkę do listy życzeń!' });
				},
			);
		} else {
			const zapytanieWstaw =
				'INSERT INTO Ksiazki (id, tytul, autor, kategoria, stan, wlasciciel) VALUES (?, ?, ?, ?, ?, ?)';
			connection.query(
				zapytanieWstaw,
				[noweId, tytul, autor, kategoria, stan, wlasciciel],
				(bladWstawiania, wynik) => {
					if (bladWstawiania) {
						if (bladWstawiania.code === 'ER_DUP_ENTRY')
							return res
								.status(400)
								.json({ error: 'Książka o tym tytule już istnieje na półce!' });
						return res.status(500).json({ error: bladWstawiania.message });
					}
					res.json({ message: 'Dodano książkę do półki ofert!' });
				},
			);
		}
	});
});

app.delete('/api/books/:id', (req, res) => {
	const idKsiazki = req.params.id;
	const zapytanie = 'DELETE FROM Ksiazki WHERE id = ?';
	connection.query(zapytanie, [idKsiazki], (blad, wynik) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ message: 'Książka została usunięta z półki!' });
	});
});

app.delete('/api/wishlist/:id', (req, res) => {
	const idKsiazki = req.params.id;
	const zapytanie = 'DELETE FROM wishlist WHERE id = ?';
	connection.query(zapytanie, [idKsiazki], (blad, wynik) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ message: 'Książka została usunięta z listy życzeń!' });
	});
});

app.get('/api/auctions', (req, res) => {
	const { search, category, condition, currentUser } = req.query;

	let zapytanie = 'SELECT * FROM Ksiazki WHERE 1=1';
	const parametry = [];

	if (currentUser) {
		zapytanie += ' AND wlasciciel != ?';
		parametry.push(currentUser);
	}

	if (search) {
		zapytanie += ' AND (tytul LIKE ? OR autor LIKE ?)';
		parametry.push(`%${search}%`, `%${search}%`);
	}

	if (category) {
		zapytanie += ' AND kategoria = ?';
		parametry.push(category);
	}

	if (condition) {
		zapytanie += ' AND stan = ?';
		parametry.push(condition);
	}

	zapytanie += ' ORDER BY id DESC';

	connection.query(zapytanie, parametry, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ books: wiersze });
	});
});

app.get('/api/random-books', (req, res) => {
	const { currentUser } = req.query;

	let zapytanie = 'SELECT * FROM Ksiazki';
	const parametry = [];

	if (currentUser) {
		zapytanie += ' WHERE wlasciciel != ?';
		parametry.push(currentUser);
	}

	zapytanie += ' ORDER BY RAND() LIMIT 3';

	connection.query(zapytanie, parametry, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ books: wiersze });
	});
});

app.post('/api/register', (req, res) => {
	const { login, email, haslo } = req.body;
	const zapytanie =
		"INSERT INTO konta (login, email, haslo, typ_konta, czy_zablokowane) VALUES (?, ?, ?, 'Użytkownik', FALSE)";

	connection.query(zapytanie, [login, email, haslo], (blad, wynik) => {
		if (blad) {
			if (blad.code === 'ER_DUP_ENTRY') {
				return res
					.status(400)
					.json({ error: 'Taki login lub adres e-mail jest już zajęty!' });
			}
			return res.status(500).json({ error: blad.message });
		}
		res.json({ message: 'Konto zostało pomyślnie utworzone!' });
	});
});

app.post('/api/login', (req, res) => {
	const { login, haslo } = req.body;
	const zapytanie =
		'SELECT login, typ_konta, czy_zablokowane FROM konta WHERE (login = ? OR email = ?) AND haslo = ?';

	connection.query(zapytanie, [login, login, haslo], (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });

		if (wiersze.length === 0) {
			return res
				.status(400)
				.json({ error: 'Nieprawidłowy login/e-mail lub hasło!' });
		}
		const daneUzytkownika = wiersze[0];
		if (daneUzytkownika.czy_zablokowane) {
			return res.status(403).json({ error: 'KONTO_ZABLOKOWANE' });
		}

		res.json({
			success: true,
			login: daneUzytkownika.login,
			typ_konta: daneUzytkownika.typ_konta,
		});
	});
});

app.get('/api/profile', (req, res) => {
	const loginKonta = req.query.user;

	const zapytanie = `
        SELECT k.email, k.imie, k.nazwisko, k.telefon, k.miasto, k.kod_pocztowy, k.opis,
               IFNULL(AVG(o.ocena), 0) AS srednia_ocen, COUNT(o.id) AS liczba_ocen
        FROM konta k
        LEFT JOIN opinie o ON k.login = o.oceniany
        WHERE k.login = ?
        GROUP BY k.login
    `;

	connection.query(zapytanie, [loginKonta], (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		if (wiersze.length === 0)
			return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

		res.json(wiersze[0]);
	});
});

app.put('/api/profile', (req, res) => {
	const { login, imie, nazwisko, telefon, miasto, kod_pocztowy, opis } =
		req.body;

	const zapytanie = `
        UPDATE konta 
        SET imie = ?, nazwisko = ?, telefon = ?, miasto = ?, kod_pocztowy = ?, opis = ? 
        WHERE login = ?
    `;

	connection.query(
		zapytanie,
		[imie, nazwisko, telefon, miasto, kod_pocztowy, opis, login],
		(blad, wynik) => {
			if (blad) return res.status(500).json({ error: blad.message });
			res.json({ message: 'Dane profilu zostały zaktualizowane!' });
		},
	);
});

app.put('/api/change-password', (req, res) => {
	const { login, stareHaslo, noweHaslo } = req.body;

	const zapytanieSprawdz = 'SELECT haslo FROM konta WHERE login = ?';
	connection.query(zapytanieSprawdz, [login], (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		if (wiersze.length === 0)
			return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });

		if (wiersze[0].haslo !== stareHaslo) {
			return res
				.status(400)
				.json({ error: 'Aktualne hasło jest nieprawidłowe!' });
		}

		const zapytanieAktualizuj = 'UPDATE konta SET haslo = ? WHERE login = ?';
		connection.query(
			zapytanieAktualizuj,
			[noweHaslo, login],
			(bladAktualizacji, wynik) => {
				if (bladAktualizacji)
					return res.status(500).json({ error: bladAktualizacji.message });
				res.json({ message: 'Hasło zostało pomyślnie zmienione!' });
			},
		);
	});
});

app.delete('/api/delete-account/:user', (req, res) => {
	const loginKonta = req.params.user;

	const zapytanieKsiazki = 'DELETE FROM Ksiazki WHERE wlasciciel = ?';
	connection.query(zapytanieKsiazki, [loginKonta], (blad) => {
		if (blad) return res.status(500).json({ error: blad.message });

		const zapytanieZyczenia = 'DELETE FROM wishlist WHERE wlasciciel = ?';
		connection.query(zapytanieZyczenia, [loginKonta], (bladZyczen) => {
			if (bladZyczen)
				return res.status(500).json({ error: bladZyczen.message });

			const zapytanieKonto = 'DELETE FROM konta WHERE login = ?';
			connection.query(zapytanieKonto, [loginKonta], (bladKonta) => {
				if (bladKonta)
					return res.status(500).json({ error: bladKonta.message });
				res.json({ message: 'Konto zostało pomyślnie usunięte.' });
			});
		});
	});
});
app.get('/api/admin/books', (req, res) => {
	const zapytanie = 'SELECT * FROM Ksiazki ORDER BY id DESC';
	connection.query(zapytanie, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ books: wiersze });
	});
});
app.get('/api/admin/users', (req, res) => {
	const zapytanie =
		'SELECT id, login, email, typ_konta, miasto, czy_zablokowane FROM konta ORDER BY id DESC';
	connection.query(zapytanie, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ users: wiersze });
	});
});

app.put('/api/admin/toggle-block', (req, res) => {
	const { loginKonta, blokada } = req.body;

	const zapytanie = 'UPDATE konta SET czy_zablokowane = ? WHERE login = ?';
	connection.query(zapytanie, [blokada, loginKonta], (blad, wynik) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({
			message: blokada
				? 'Konto zostało zablokowane.'
				: 'Konto zostało pomyślnie odblokowane.',
		});
	});
});

app.get('/api/admin/wymiany', (req, res) => {
	const zapytanie = 'SELECT * FROM wymiany ORDER BY data_utworzenia DESC';
	connection.query(zapytanie, (blad, wiersze) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ wymiany: wiersze });
	});
});

app.put('/api/admin/wymiany/:id/status', (req, res) => {
	const idWymiany = req.params.id;
	const { status } = req.body;

	const zapytanie = 'UPDATE wymiany SET status = ? WHERE id = ?';
	connection.query(zapytanie, [status, idWymiany], (blad, wynik) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ message: 'Status transakcji został zaktualizowany.' });
	});
});

app.delete('/api/admin/wymiany/:id', (req, res) => {
	const idWymiany = req.params.id;

	const zapytanie = "UPDATE wymiany SET status = 'odrzucona' WHERE id = ?";
	connection.query(zapytanie, [idWymiany], (blad, wynik) => {
		if (blad) return res.status(500).json({ error: blad.message });
		res.json({ message: 'Transakcja została odrzucona (usunięta przez admina).' });
	});
});

app.post('/api/wymiany', (req, res) => {
	const { id_ksiazki_oferowanej, id_ksiazki_zadanej, login_nadawcy } = req.body;

	connection.query(
		'SELECT tytul, autor, wlasciciel FROM Ksiazki WHERE id = ?',
		[id_ksiazki_zadanej],
		(blad, wiersze) => {
			if (blad) return res.json({ error: blad.message });
			if (wiersze.length === 0)
				return res.json({ error: 'Nie znaleziono książki' });
			const ksiazkaZadana = wiersze[0];
			if (ksiazkaZadana.wlasciciel === login_nadawcy)
				return res.json({ error: 'Nie możesz wymieniać się ze sobą' });

			connection.query(
				'SELECT tytul, autor FROM Ksiazki WHERE id = ? AND wlasciciel = ?',
				[id_ksiazki_oferowanej, login_nadawcy],
				(blad2, wiersze2) => {
					if (blad2) return res.json({ error: blad2.message });
					if (wiersze2.length === 0)
						return res.json({ error: 'Nie posiadasz tej książki' });
					const ksiazkaOferowana = wiersze2[0];

					connection.query(
						'INSERT INTO wymiany (id_ksiazki_oferowanej, id_ksiazki_zadanej, tytul_oferowanej, autor_oferowanej, tytul_zadanej, autor_zadanej, login_nadawcy, login_odbiorcy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
						[
							id_ksiazki_oferowanej,
							id_ksiazki_zadanej,
							ksiazkaOferowana.tytul,
							ksiazkaOferowana.autor,
							ksiazkaZadana.tytul,
							ksiazkaZadana.autor,
							login_nadawcy,
							ksiazkaZadana.wlasciciel,
						],
						(blad3) => {
							if (blad3) return res.json({ error: blad3.message });
							res.json({ message: 'Oferta wysłana' });
						},
					);
				},
			);
		},
	);
});

app.get('/api/wymiany/historia', (req, res) => {
	const { user } = req.query;

	connection.query(
		`
        SELECT id, login_nadawcy, login_odbiorcy, status, data_utworzenia,
               tytul_oferowanej, autor_oferowanej, tytul_zadanej, autor_zadanej
        FROM wymiany
        WHERE (login_nadawcy = ? OR login_odbiorcy = ?)
        AND status IN ('zakonczona', 'odrzucona', 'zablokowana')
        ORDER BY data_utworzenia DESC
    `,
		[user, user],
		(blad, wiersze) => {
			if (blad) return res.json({ error: blad.message });
			res.json({ historia: wiersze });
		},
	);
});

app.get('/api/wymiany', (req, res) => {
	const { user } = req.query;

	connection.query(
		`
        SELECT id, login_nadawcy, status,
               tytul_oferowanej, autor_oferowanej, tytul_zadanej
        FROM wymiany
        WHERE login_odbiorcy = ? AND status = 'oczekuje'
    `,
		[user],
		(blad, wiersze) => {
			if (blad) return res.json({ error: blad.message });
			res.json({ wymiany: wiersze });
		},
	);
});

app.put('/api/wymiany/:id', (req, res) => {
	const { status, login } = req.body;
	const { id } = req.params;

	connection.query(
		'SELECT * FROM wymiany WHERE id = ?',
		[id],
		(blad, wiersze) => {
			if (blad) return res.json({ error: blad.message });
			if (wiersze.length === 0)
				return res.json({ error: 'Nie znaleziono wymiany' });
			const wymiana = wiersze[0];
			if (wymiana.login_odbiorcy !== login)
				return res.json({ error: 'Brak uprawnień' });

			const idOferowanej = wymiana.id_ksiazki_oferowanej;
			const idZadanej = wymiana.id_ksiazki_zadanej;
			const nowyStatus =
				status === 'zaakceptowana' ? 'zakonczona' : 'odrzucona';

			connection.query(
				'UPDATE wymiany SET status = ? WHERE id = ?',
				[nowyStatus, id],
				(blad2) => {
					if (blad2) return res.json({ error: blad2.message });

					if (nowyStatus === 'zakonczona') {
						connection.query(
							'UPDATE wymiany SET status = ? WHERE id != ? AND status = ? AND (id_ksiazki_oferowanej IN (?, ?) OR id_ksiazki_zadanej IN (?, ?))',
							[
								'odrzucona',
								id,
								'oczekuje',
								idOferowanej,
								idZadanej,
								idOferowanej,
								idZadanej,
							],
							(blad3) => {
								if (blad3) return res.json({ error: blad3.message });

								connection.query(
									'DELETE FROM Ksiazki WHERE id = ?',
									[idOferowanej],
									(blad4) => {
										if (blad4) return res.json({ error: blad4.message });
										connection.query(
											'DELETE FROM Ksiazki WHERE id = ?',
											[idZadanej],
											(blad5) => {
												if (blad5) return res.json({ error: blad5.message });
												res.json({ 
                                                    message: 'Gotowe', 
                                                    id_wymiany: id, 
                                                    oceniany: wymiana.login_nadawcy 
                                                });
											},
										);
									},
								);
							},
						);
					} else {
						res.json({ message: 'Gotowe' });
					}
				},
			);
		},
	);
});


app.post('/api/opinie', (req, res) => {
    const { id_wymiany, oceniajacy, oceniany, ocena, komentarz } = req.body;
    

    const zapytanieSprawdz = "SELECT * FROM opinie WHERE id_wymiany = ? AND oceniajacy = ?";
    connection.query(zapytanieSprawdz, [id_wymiany, oceniajacy], (blad, wiersze) => {
        if (blad) return res.json({error: blad.message});
        if (wiersze.length > 0) return res.json({error: "Już wystawiłeś opinię za tę wymianę!"});

        const zapytanieWstaw = "INSERT INTO opinie (id_wymiany, oceniajacy, oceniany, ocena, komentarz) VALUES (?, ?, ?, ?, ?)";
        connection.query(zapytanieWstaw, [id_wymiany, oceniajacy, oceniany, ocena, komentarz], (bladWstaw) => {
            if (bladWstaw) return res.json({error: bladWstaw.message});
            res.json({message: "Opinia została pomyślnie dodana!"});
        });
    });
});

app.get('/api/opinie', (req, res) => {
    const { user } = req.query;
    const zapytanie = "SELECT * FROM opinie WHERE oceniany = ? ORDER BY data_dodania DESC";
    connection.query(zapytanie, [user], (blad, wiersze) => {
        if (blad) return res.json({error: blad.message});
        res.json({opinie: wiersze});
    });
});

app.listen(PORT, () => {
	console.log(`Serwer dziala: http://localhost:${PORT}`);
});