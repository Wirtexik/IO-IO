document.addEventListener('DOMContentLoaded', () => {
	if (document.getElementById('booksBody')) {
		pobierzKsiazki();
	}
	if (document.getElementById('wishlistBody')) {
		pobierzListeZyczen();
	}

	if (document.getElementById('randomBooksBody')) {
		pobierzLosoweKsiazki();
	}

	const przyciskSzukajGlowne = document.getElementById('home-search-btn');
	if (przyciskSzukajGlowne) {
		przyciskSzukajGlowne.addEventListener('click', () => {
			const poleWyszukiwania = document.getElementById('home-search');
			const poleKategorii = document.getElementById('home-category');

			const wartoscWyszukiwania = poleWyszukiwania
				? poleWyszukiwania.value
				: '';
			const wartoscKategorii = poleKategorii ? poleKategorii.value : '';

			const parametry = new URLSearchParams();
			if (wartoscWyszukiwania) parametry.append('search', wartoscWyszukiwania);
			if (wartoscKategorii) parametry.append('category', wartoscKategorii);

			window.location.href = `aukcje.html?${parametry.toString()}`;
		});
	}

	const cialoAukcji = document.getElementById('auctionsBody');
	if (cialoAukcji) {
		const przyciskFiltrow = document.getElementById('apply-filters-btn');
		if (przyciskFiltrow) {
			przyciskFiltrow.addEventListener('click', pobierzAukcje);
		}

		const parametryUrl = new URLSearchParams(window.location.search);
		if (parametryUrl.has('search') || parametryUrl.has('category')) {
			const zapytanieSzukaj = parametryUrl.get('search') || '';
			const zapytanieKategoria = parametryUrl.get('category') || '';

			const inputTytulu = document.getElementById('search-title');
			const selectKategorii = document.getElementById('filter-category');

			if (inputTytulu) inputTytulu.value = zapytanieSzukaj;
			if (selectKategorii) selectKategorii.value = zapytanieKategoria;
		}

		// ZMIANA: Pobieramy wszystkie oferty ZAWSZE po wejściu w zakładkę Aukcje.
		// Skrypt sam zaciągnie filtry (jeśli jakieś zostały wpisane), a jeśli są puste - pokaże wszystko.
		pobierzAukcje();

		// BONUS UX: Automatyczne szukanie po wciśnięciu klawisza "Enter" w polu wpisywania
		const poleWyszukiwarki = document.getElementById('search-title');
		if (poleWyszukiwarki) {
			poleWyszukiwarki.addEventListener('keypress', (zdarzenie) => {
				if (zdarzenie.key === 'Enter') pobierzAukcje();
			});
		}

		// BONUS UX: Automatyczne szukanie od razu po zmianie kategorii lub stanu z listy rozwijanej
		const poleKategorii = document.getElementById('filter-category');
		const poleStanu = document.getElementById('filter-condition');
		if (poleKategorii) poleKategorii.addEventListener('change', pobierzAukcje);
		if (poleStanu) poleStanu.addEventListener('change', pobierzAukcje);
	}
});

function ustawNawigacjeLogowania() {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	const rolaUzytkownika = localStorage.getItem('rolaUzytkownika');
	const kontenerLinkow = document.querySelector('.nav-links');
	const linkiNawigacji = document.querySelectorAll('.nav-links a');
	let linkLogowania = null;

	linkiNawigacji.forEach((link) => {
		if (
			link.getAttribute('href') === 'profil.html' ||
			link.getAttribute('href') === 'zaloguj.html'
		) {
			linkLogowania = link;
		}
	});

	if (zalogowanyUzytkownik && linkLogowania) {
		linkLogowania.textContent = zalogowanyUzytkownik;
		linkLogowania.setAttribute('href', 'profil.html');
		linkLogowania.classList.remove('active-link');
	}

	if (rolaUzytkownika === 'Moderator' && kontenerLinkow) {
		const czyJestLinkAdmina = document.querySelector('a[href="admin.html"]');
		if (!czyJestLinkAdmina && linkLogowania) {
			const linkAdmina = document.createElement('a');
			linkAdmina.href = 'admin.html';
			linkAdmina.textContent = 'Panel admina';
			linkAdmina.style.color = '#ef4444';
			kontenerLinkow.insertBefore(linkAdmina, linkLogowania);
		}
	}
}

function switchTab(nazwaZakladki, zdarzenie) {
	const zakladki = document.querySelectorAll('.tab-content');
	zakladki.forEach((zakladka) => zakladka.classList.remove('active'));

	const przyciski = document.querySelectorAll('.tab-button');
	przyciski.forEach((przycisk) => przycisk.classList.remove('active'));

	document.getElementById('tab-' + nazwaZakladki).classList.add('active');
	if (zdarzenie && zdarzenie.target) {
		zdarzenie.target.classList.add('active');
	}
}

function logout() {
	localStorage.removeItem('zalogowanyUzytkownik');
	localStorage.removeItem('rolaUzytkownika');
	localStorage.removeItem('zarejestrowanyEmail');
	window.location.href = 'zaloguj.html';
}

function loadProfileData() {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) return;

	fetch(`/api/profile?user=${zalogowanyUzytkownik}`)
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) return;

			const poleLokalizacji = document.getElementById('displayLocation');
			const poleTelefonu = document.getElementById('displayPhone');
			const poleEmail = document.getElementById('profileEmail');

			if (poleEmail) poleEmail.textContent = dane.email || 'Brak e-maila';
			if (poleLokalizacji) {
				if (dane.miasto || dane.kod_pocztowy) {
					poleLokalizacji.innerHTML =
						`<span>📍</span> ${dane.miasto || ''} ${dane.kod_pocztowy || ''}`.trim();
				} else {
					poleLokalizacji.innerHTML = `<span>📍</span> Nie podano lokalizacji`;
				}
			}
			if (poleTelefonu) {
				poleTelefonu.innerHTML = `<span>📱</span> ${dane.telefon || 'Brak numeru telefonu'}`;
			}

			if (document.getElementById('set-imie'))
				document.getElementById('set-imie').value = dane.imie || '';
			if (document.getElementById('set-nazwisko'))
				document.getElementById('set-nazwisko').value = dane.nazwisko || '';
			if (document.getElementById('set-telefon'))
				document.getElementById('set-telefon').value = dane.telefon || '';
			if (document.getElementById('set-miasto'))
				document.getElementById('set-miasto').value = dane.miasto || '';
			if (document.getElementById('set-kod'))
				document.getElementById('set-kod').value = dane.kod_pocztowy || '';
			if (document.getElementById('set-opis'))
				document.getElementById('set-opis').value = dane.opis || '';
		})
		.catch((blad) => console.error('Błąd ładowania profilu:', blad));
}

function saveSettings() {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) {
		alert('Musisz być zalogowany!');
		return;
	}

	const daneProfilu = {
		login: zalogowanyUzytkownik,
		imie: document.getElementById('set-imie').value,
		nazwisko: document.getElementById('set-nazwisko').value,
		telefon: document.getElementById('set-telefon').value,
		miasto: document.getElementById('set-miasto').value,
		kod_pocztowy: document.getElementById('set-kod').value,
		opis: document.getElementById('set-opis').value,
	};

	fetch('/api/profile', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(daneProfilu),
	})
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) {
				alert('❌ Błąd zapisu: ' + dane.error);
			} else {
				alert('✅ ' + dane.message);
				loadProfileData();
			}
		})
		.catch((blad) => console.error('Błąd zapisywania profilu:', blad));
}

function openModal(doceloweMiejsce) {
	const oknoGlowne = document.getElementById('addBookModal');
	if (oknoGlowne) {
		oknoGlowne.style.display = 'block';
		const divStatusu = document.getElementById('addStatus');
		if (divStatusu) divStatusu.textContent = '';

		if (doceloweMiejsce) {
			const ukrytyDocelowy = document.getElementById('destination');
			const poleIlosciOkna = document.getElementById('ilosc');

			if (ukrytyDocelowy) ukrytyDocelowy.value = doceloweMiejsce;

			if (poleIlosciOkna) {
				if (doceloweMiejsce === 'wishlist') {
					poleIlosciOkna.style.display = 'none';
					poleIlosciOkna.removeAttribute('required');
				} else {
					poleIlosciOkna.style.display = 'block';
					poleIlosciOkna.setAttribute('required', 'required');
				}
			}
		}
	}
}

function closeModal() {
	const oknoGlowne = document.getElementById('addBookModal');
	if (oknoGlowne) oknoGlowne.style.display = 'none';
}

function openPasswordModal() {
	const oknoHasla = document.getElementById('changePasswordModal');
	if (oknoHasla) {
		oknoHasla.style.display = 'block';
		const statusHasla = document.getElementById('passwordStatus');
		if (statusHasla) statusHasla.textContent = '';
	}
}

function closePasswordModal() {
	const oknoHasla = document.getElementById('changePasswordModal');
	if (oknoHasla) oknoHasla.style.display = 'none';
}

function closeAccountBlockedModal() {
	const oknoBlokady = document.getElementById('accountBlockedModal');
	if (oknoBlokady) oknoBlokady.style.display = 'none';
}

window.onclick = function (zdarzenie) {
	let modalKsiazki = document.getElementById('addBookModal');
	let modalRejestracji = document.getElementById('registerSuccessModal');
	let modalHasla = document.getElementById('changePasswordModal');
	let modalBlokady = document.getElementById('accountBlockedModal');
	let modalWymiany = document.getElementById('modalWymiany');

	if (zdarzenie.target == modalKsiazki) closeModal();
	if (zdarzenie.target == modalRejestracji) closeRegisterSuccessModal();
	if (zdarzenie.target == modalHasla) closePasswordModal();
	if (zdarzenie.target == modalBlokady) closeAccountBlockedModal();
	if (zdarzenie.target == modalWymiany) zamknijModalWymiany();
};

const formularzKsiazki = document.getElementById('addBookForm');
if (formularzKsiazki) {
	formularzKsiazki.addEventListener('submit', function (zdarzenie) {
		zdarzenie.preventDefault();

		const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
		if (!zalogowanyUzytkownik) {
			alert('Musisz się zalogować, aby dodać książkę!');
			return;
		}

		const statusDodawania = document.getElementById('addStatus');
		const daneFormularza = {
			destination: document.getElementById('destination').value,
			tytul: document.getElementById('tytul').value,
			autor: document.getElementById('autor').value,
			kategoria: document.getElementById('kategoria').value,
			stan: document.getElementById('stan').value,
			wlasciciel: zalogowanyUzytkownik,
		};

		fetch('/api/books', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(daneFormularza),
		})
			.then((odpowiedz) => odpowiedz.json())
			.then((dane) => {
				if (dane.error) {
					statusDodawania.textContent = '❌ ' + dane.error;
					statusDodawania.style.color = '#dc2626';
				} else {
					statusDodawania.textContent = '✅ ' + dane.message;
					statusDodawania.style.color = '#10b981';

					document.getElementById('addBookForm').reset();

					pobierzKsiazki();
					pobierzListeZyczen();
					setTimeout(closeModal, 1500);
				}
			})
			.catch((blad) => {
				statusDodawania.textContent = '❌ Błąd połączenia z serwerem';
				statusDodawania.style.color = '#dc2626';
			});
	});
}

const formularzZaminyHasla = document.getElementById('changePasswordForm');
if (formularzZaminyHasla) {
	formularzZaminyHasla.addEventListener('submit', function (zdarzenie) {
		zdarzenie.preventDefault();

		const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
		if (!zalogowanyUzytkownik) return;

		const stareHaslo = document.getElementById('old-password').value;
		const noweHaslo = document.getElementById('new-password').value;
		const powtorzoneHaslo = document.getElementById(
			'new-password-confirm',
		).value;
		const divStatusuHasla = document.getElementById('passwordStatus');

		if (noweHaslo !== powtorzoneHaslo) {
			divStatusuHasla.textContent = '❌ Nowe hasła nie są identyczne!';
			divStatusuHasla.style.color = '#dc2626';
			return;
		}

		fetch('/api/change-password', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				login: zalogowanyUzytkownik,
				stareHaslo: stareHaslo,
				noweHaslo: noweHaslo,
			}),
		})
			.then((odpowiedz) => odpowiedz.json())
			.then((dane) => {
				if (dane.error) {
					divStatusuHasla.textContent = '❌ ' + dane.error;
					divStatusuHasla.style.color = '#dc2626';
				} else {
					divStatusuHasla.textContent = '✅ ' + dane.message;
					divStatusuHasla.style.color = '#10b981';
					formularzZaminyHasla.reset();
					setTimeout(closePasswordModal, 1500);
				}
			})
			.catch((blad) => {
				divStatusuHasla.textContent = '❌ Błąd połączenia z serwerem.';
				divStatusuHasla.style.color = '#dc2626';
			});
	});
}

function deleteAccount() {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) return;

	if (
		confirm(
			'⚠️ UWAGA: Czy na pewno chcesz trwale usunąć swoje konto? Ta operacja usunie wszystkie Twoje dane oraz wystawione książki. Nie można tego cofnąć!',
		)
	) {
		fetch(`/api/delete-account/${zalogowanyUzytkownik}`, { method: 'DELETE' })
			.then((odpowiedz) => odpowiedz.json())
			.then((dane) => {
				if (dane.error) {
					alert('❌ Błąd usuwania konta: ' + dane.error);
				} else {
					alert('✅ ' + dane.message);
					logout();
				}
			})
			.catch((blad) => console.error('Błąd podczas usuwania konta: ', blad));
	}
}

function pobierzKsiazki() {
	const cialoTabeli = document.getElementById('booksBody');
	if (!cialoTabeli) return;

	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) {
		cialoTabeli.innerHTML =
			'<p class="text-muted-padded">Zaloguj się, aby zobaczyć swoją półkę.</p>';
		return;
	}

	fetch(`/api/test-books?user=${zalogowanyUzytkownik}`)
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			const statystykiKsiazek = document.getElementById('statBooks');
			const licznikKsiazek = document.getElementById('booksCount');
			if (statystykiKsiazek) statystykiKsiazek.textContent = dane.books.length;
			if (licznikKsiazek) licznikKsiazek.textContent = dane.books.length;

			cialoTabeli.innerHTML = '';

			if (dane.books.length === 0) {
				if (statystykiKsiazek) {
					cialoTabeli.innerHTML =
						'<div class="empty-state"><div class="empty-state-icon">📚</div><h3>Brak książek</h3><p>Dodaj swoją pierwszą książkę do oferty!</p></div>';
				} else {
					cialoTabeli.innerHTML =
						'<p class="text-muted-padded">Twoja półka ofert jest pusta.</p>';
				}
				return;
			}

			dane.books.forEach((ksiazka) => {
				const pierwszaLitera = ksiazka.tytul.charAt(0).toUpperCase();

				if (statystykiKsiazek) {
					cialoTabeli.innerHTML += `
                        <div class="book-item">
                            <div class="flex-gap-15">
                                <div class="item-icon">${pierwszaLitera}</div>
                                <div class="book-item-info">
                                    <h4>${ksiazka.tytul}</h4>
                                    <p>${ksiazka.autor}</p>
                                    <p>Kategoria: ${ksiazka.kategoria} • Stan: ${ksiazka.stan}</p>
                                </div>
                            </div>
                            <div class="book-item-status">
                                <span class="status-badge available">✓ Dostępne</span>
                                <button class="btn-danger-outline" onclick="usunKsiazke(${ksiazka.id})">Usuń</button>
                            </div>
                        </div>
                    `;
				} else {
					cialoTabeli.innerHTML += `
                        <div class="list-item">
                            <div class="item-icon">${pierwszaLitera}</div>
                            <div class="item-details">
                                <h4>${ksiazka.tytul}</h4>
                                <p>${ksiazka.autor} • <span class="text-muted-sm">Stan: ${ksiazka.stan}</span></p>
                            </div>
                            <button class="btn-danger-outline" onclick="usunKsiazke(${ksiazka.id})">Usuń</button>
                        </div>
                    `;
				}
			});
		});
}

function pobierzListeZyczen() {
	const cialoZyczen = document.getElementById('wishlistBody');
	if (!cialoZyczen) return;

	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) {
		cialoZyczen.innerHTML =
			'<p class="text-muted-padded">Zaloguj się, aby zobaczyć swoją listę życzeń.</p>';
		return;
	}

	fetch(`/api/wishlist?user=${zalogowanyUzytkownik}`)
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			const statystykiZyczen = document.getElementById('statWishlist');
			const licznikZyczen = document.getElementById('wishlistCount');
			if (statystykiZyczen) statystykiZyczen.textContent = dane.books.length;
			if (licznikZyczen) licznikZyczen.textContent = dane.books.length;

			cialoZyczen.innerHTML = '';

			if (dane.books.length === 0) {
				if (statystykiZyczen) {
					cialoZyczen.innerHTML =
						'<div class="empty-state"><div class="empty-state-icon">❤️</div><h3>Pusta lista życzeń</h3><p>Dodaj książki, aby śledzić interesujące Tytuły!</p></div>';
				} else {
					cialoZyczen.innerHTML =
						'<p class="text-muted-padded">Twoja lista życzeń jest pusta.</p>';
				}
				return;
			}

			dane.books.forEach((ksiazka) => {
				const pierwszaLitera = ksiazka.tytul.charAt(0).toUpperCase();

				if (statystykiZyczen) {
					cialoZyczen.innerHTML += `
                        <div class="book-item">
                            <div class="flex-gap-15">
                                <div class="item-icon wishlist-icon-bg">${pierwszaLitera}</div>
                                <div class="book-item-info">
                                    <h4>${ksiazka.tytul}</h4>
                                    <p>${ksiazka.autor}</p>
                                    <p>Stan: ${ksiazka.stan} • Kategoria: ${ksiazka.kategoria}</p>
                                </div>
                            </div>
                            <div class="book-item-status">
                                <span class="status-badge">Szukane</span>
                                <button class="btn-danger-outline" onclick="usunZyczenie(${ksiazka.id})">Usuń</button>
                            </div>
                        </div>
                    `;
				} else {
					cialoZyczen.innerHTML += `
                        <div class="list-item">
                            <div class="item-icon wishlist-icon-bg">${pierwszaLitera}</div>
                            <div class="item-details">
                                <h4>${ksiazka.tytul}</h4>
                                <p>${ksiazka.autor} • <span class="text-muted-sm">Stan: ${ksiazka.stan}</span></p>
                            </div>
                            <button class="btn-danger-outline" onclick="usunZyczenie(${ksiazka.id})">Usuń</button>
                        </div>
                    `;
				}
			});
		});
}

function usunKsiazke(idKsiazki) {
	if (!confirm('Czy na pewno chcesz usunąć tę książkę z półki ofert?')) return;

	fetch(`/api/books/${idKsiazki}`, { method: 'DELETE' })
		.then((odpowiedz) => odpowiedz.json())
		.then(() => {
			pobierzKsiazki();
			pobierzListeZyczen();
		});
}

function usunZyczenie(idKsiazki) {
	if (!confirm('Czy na pewno chcesz usunąć tę książkę z listy życzeń?')) return;

	fetch(`/api/wishlist/${idKsiazki}`, { method: 'DELETE' })
		.then((odpowiedz) => odpowiedz.json())
		.then(() => {
			pobierzKsiazki();
			pobierzListeZyczen();
		});
}
document.addEventListener('DOMContentLoaded', () => {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	const rolaUzytkownika = localStorage.getItem('rolaUzytkownika');

	if (window.location.pathname.includes('profil.html')) {
		if (!zalogowanyUzytkownik) {
			window.location.href = 'zaloguj.html';
		} else {
			const elementNazwy = document.getElementById('userName');
			const elementAwataru = document.getElementById('avatarDisplay');

			if (elementNazwy) elementNazwy.textContent = zalogowanyUzytkownik;
			if (elementAwataru)
				elementAwataru.textContent = zalogowanyUzytkownik
					.charAt(0)
					.toUpperCase();

			loadProfileData();
			pobierzPrzychodzaceWymiany();
			pobierzHistorieWymian();
		}
	}

	if (window.location.pathname.includes('admin.html')) {
		if (!zalogowanyUzytkownik || rolaUzytkownika !== 'Moderator') {
			alert('Brak dostępu! Strona tylko dla Moderatorów.');
			window.location.href = 'index.html';
		} else {
			pobierzKsiazkiDlaAdmina();
			pobierzUzytkownikowDlaAdmina();
			pobierzWymianyDlaAdmina();
		}
	}
});
function switchAuthTab(nazwaZakladki) {
	const zakladkiLogowania = document.querySelectorAll('.auth-tab');
	const formularzLogowania = document.getElementById('login-form');
	const formularzRejestracji = document.getElementById('register-form');

	if (!formularzLogowania || !formularzRejestracji) return;

	if (nazwaZakladki === 'login') {
		zakladkiLogowania[0].classList.add('active');
		zakladkiLogowania[1].classList.remove('active');
		formularzLogowania.classList.add('active');
		formularzRejestracji.classList.remove('active');
	} else {
		zakladkiLogowania[0].classList.remove('active');
		zakladkiLogowania[1].classList.add('active');
		formularzLogowania.classList.remove('active');
		formularzRejestracji.classList.add('active');
	}
}

function handleLogin(zdarzenie) {
	zdarzenie.preventDefault();
	const loginKonta = document.getElementById('login-input').value;
	const hasloKonta = document.getElementById('login-haslo').value;
	const divBledu = document.getElementById('login-error');

	divBledu.style.display = 'none';

	fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ login: loginKonta, haslo: hasloKonta }),
	})
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error === 'KONTO_ZABLOKOWANE') {
				const oknoBlokady = document.getElementById('accountBlockedModal');
				if (oknoBlokady) oknoBlokady.style.display = 'block';
			} else if (dane.error) {
				divBledu.textContent = '❌ ' + dane.error;
				divBledu.style.display = 'block';
			} else {
				localStorage.setItem('zalogowanyUzytkownik', dane.login);
				if (dane.typ_konta) {
					localStorage.setItem('rolaUzytkownika', dane.typ_konta);
				}
				window.location.href = 'profil.html';
			}
		})
		.catch((blad) => {
			divBledu.textContent = '❌ Błąd połączenia z serwerem.';
			divBledu.style.display = 'block';
		});
}

function handleRegister(zdarzenie) {
	zdarzenie.preventDefault();
	const loginKonta = document.getElementById('reg-login').value;
	const emailKonta = document.getElementById('reg-email').value;
	const hasloKonta = document.getElementById('reg-haslo').value;
	const hasloPowtorzone = document.getElementById('reg-haslo2').value;
	const divBleduRej = document.getElementById('reg-error');

	divBleduRej.style.display = 'none';

	if (hasloKonta !== hasloPowtorzone) {
		divBleduRej.textContent = '❌ Hasła nie są identyczne!';
		divBleduRej.style.display = 'block';
		return;
	}

	fetch('/api/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			login: loginKonta,
			email: emailKonta,
			haslo: hasloKonta,
		}),
	})
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) {
				divBleduRej.textContent = '❌ ' + dane.error;
				divBleduRej.style.display = 'block';
			} else {
				localStorage.setItem('zarejestrowanyEmail', emailKonta);
				document.getElementById('registerSuccessModal').style.display = 'block';
				document.getElementById('register-form').reset();
			}
		})
		.catch((blad) => {
			divBleduRej.textContent = '❌ Błąd połączenia z serwerem.';
			divBleduRej.style.display = 'block';
		});
}

function closeRegisterSuccessModal() {
	const oknoRejestracji = document.getElementById('registerSuccessModal');
	if (oknoRejestracji) {
		oknoRejestracji.style.display = 'none';
		switchAuthTab('login');
	}
}

function pobierzAukcje() {
	const cialoAukcji = document.getElementById('auctionsBody');
	const licznikWynikow = document.getElementById('results-count');
	if (!cialoAukcji) return;

	const szukanyTytul = document.getElementById('search-title')?.value || '';
	const szukanaKategoria =
		document.getElementById('filter-category')?.value || '';
	const szukanyStan = document.getElementById('filter-condition')?.value || '';

	const parametryUrl = new URLSearchParams({
		search: szukanyTytul,
		category: szukanaKategoria,
		condition: szukanyStan,
	});

	fetch(`/api/auctions?${parametryUrl.toString()}`)
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (licznikWynikow) licznikWynikow.textContent = dane.books.length;

			cialoAukcji.innerHTML = '';

			if (dane.books.length === 0) {
				cialoAukcji.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px;">
                        Brak dostępnych ofert spełniających wybrane kryteria filtrów.
                    </p>
                `;
				return;
			}

			dane.books.forEach((ksiazka) => {
				const pierwszaLitera = ksiazka.tytul.charAt(0).toUpperCase();

				cialoAukcji.innerHTML += `
             <div class="book-card">
                        <div class="card-img">${pierwszaLitera}</div>
                        <div class="card-content">
                            <h3 style="margin-bottom: 5px;">${ksiazka.tytul}</h3>
                            <p style="color: #64748b; margin-bottom: 5px;">${ksiazka.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 10px;">Stan: ${ksiazka.stan}</p>
                            
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 15px; font-size: 13px; color: #475569;">
                                <span>👤 Wystawia:</span>
                                <strong>${ksiazka.wlasciciel}</strong>
                            </div>

                            <button class="btn-outline" onclick="otworzModalWymiany(${ksiazka.id}, '${ksiazka.wlasciciel}')">
                                Zaproponuj wymianę
                            </button>
                        </div>
                    </div>
                `;
			});
		})
		.catch((blad) => {
			console.error('Błąd pobierania aukcji:', blad);
			cialoAukcji.innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 20px;">
                    Wystąpił problem podczas komunikacji z serwerem.
                </p>
            `;
		});
}

function pobierzLosoweKsiazki() {
	const cialoLosowych = document.getElementById('randomBooksBody');
	if (!cialoLosowych) return;

	fetch('/api/random-books')
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			cialoLosowych.innerHTML = '';

			if (dane.books.length === 0) {
				cialoLosowych.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">
                        Brak dostępnych ofert. Bądź pierwszą osobą, która doda książkę do wymiany!
                    </p>
                `;
				return;
			}

			dane.books.forEach((ksiazka) => {
				const pierwszaLitera = ksiazka.tytul.charAt(0).toUpperCase();

				cialoLosowych.innerHTML += `
                    <div class="book-card">
                        <div class="card-img">${pierwszaLitera}</div>
                        <div class="card-content">
                            <h3 style="margin-bottom: 5px;">${ksiazka.tytul}</h3>
                            <p style="color: #64748b; margin-bottom: 5px;">${ksiazka.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 10px;">Stan: ${ksiazka.stan}</p>
                            
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 15px; font-size: 13px; color: #475569;">
                                <span>👤 Wystawia:</span>
                                <strong>${ksiazka.wlasciciel}</strong>
                            </div>

                            <button class="btn-outline" onclick="otworzModalWymiany(${ksiazka.id}, '${ksiazka.wlasciciel}')">
                                Zaproponuj wymianę
                            </button>
                        </div>
                    </div>
                `;
			});
		})
		.catch((blad) => {
			console.error('Błąd pobierania losowych książek:', blad);
			cialoLosowych.innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 20px;">
                    Wystąpił błąd podczas ładowania przykładowych ofert.
                </p>
            `;
		});
}
function pobierzKsiazkiDlaAdmina() {
	const cialoAdminKsiazek = document.getElementById('adminBooksBody');
	const licznikAdminKsiazek = document.getElementById('adminBooksCount');
	if (!cialoAdminKsiazek) return;

	fetch('/api/admin/books')
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) {
				cialoAdminKsiazek.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Błąd: ${dane.error}</td></tr>`;
				return;
			}
			if (licznikAdminKsiazek)
				licznikAdminKsiazek.textContent = dane.books.length;

			cialoAdminKsiazek.innerHTML = '';
			if (dane.books.length === 0) {
				cialoAdminKsiazek.innerHTML =
					'<tr><td colspan="7" style="text-align:center;">Brak książek w systemie.</td></tr>';
				return;
			}

			dane.books.forEach((ksiazka) => {
				cialoAdminKsiazek.innerHTML += `
					<tr>
						<td>#${ksiazka.id}</td>
						<td><strong>${ksiazka.tytul}</strong></td>
						<td>${ksiazka.autor}</td>
						<td>${ksiazka.wlasciciel}</td>
						<td>${ksiazka.kategoria}</td>
						<td>${ksiazka.stan}</td>
						<td>
							<button class="btn-danger-outline" onclick="adminUsunKsiazke(${ksiazka.id})">Usuń</button>
						</td>
					</tr>
				`;
			});
		})
		.catch((blad) =>
			console.error('Błąd pobierania książek dla admina:', blad),
		);
}

function pobierzUzytkownikowDlaAdmina() {
	const cialoAdminUzytkownikow = document.getElementById('adminUsersBody');
	const licznikAdminUzytkownikow = document.getElementById('adminUsersCount');
	if (!cialoAdminUzytkownikow) return;

	fetch('/api/admin/users')
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) {
				cialoAdminUzytkownikow.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Błąd: ${dane.error}</td></tr>`;
				return;
			}
			if (licznikAdminUzytkownikow)
				licznikAdminUzytkownikow.textContent = dane.users.length;

			cialoAdminUzytkownikow.innerHTML = '';
			if (dane.users.length === 0) {
				cialoAdminUzytkownikow.innerHTML =
					'<tr><td colspan="6" style="text-align:center;">Brak użytkowników.</td></tr>';
				return;
			}

			dane.users.forEach((uzytkownik) => {
				const etykietaRoli =
					uzytkownik.typ_konta === 'Moderator'
						? '<span class="admin-role-badge">Moderator</span>'
						: '<span class="user-role-badge">Użytkownik</span>';

				const etykietaStatusu = uzytkownik.czy_zablokowane
					? '<span class="status-blocked">Zablokowane</span>'
					: '<span class="status-active">Aktywne</span>';

				const tekstPrzyciskuBlokady = uzytkownik.czy_zablokowane
					? 'Odblokuj'
					: 'Zablokuj';
				const klasaPrzyciskuBlokady = uzytkownik.czy_zablokowane
					? 'btn-success'
					: 'btn-outline';

				let akcjeHTML = '';
				if (uzytkownik.typ_konta !== 'Moderator') {
					akcjeHTML = `
						<div style="display: flex; gap: 5px;">
							<button class="${klasaPrzyciskuBlokady} btn-sec-action" style="padding: 4px 8px; font-size: 12px; margin: 0;" onclick="adminZmienStatusBlokady('${uzytkownik.login}', ${uzytkownik.czy_zablokowane})">${tekstPrzyciskuBlokady}</button>
							<button class="btn-danger-outline btn-sec-action" style="margin: 0;" onclick="adminUsunUzytkownika('${uzytkownik.login}')">Usuń</button>
						</div>
					`;
				} else {
					akcjeHTML =
						'<span style="color:#94a3b8;font-size:12px;">Chronione</span>';
				}

				cialoAdminUzytkownikow.innerHTML += `
					<tr>
						<td>#${uzytkownik.id}</td>
						<td><strong>${uzytkownik.login}</strong></td>
						<td>${uzytkownik.email}</td>
						<td>${etykietaRoli}</td>
						<td>${etykietaStatusu}</td>
						<td>${akcjeHTML}</td>
					</tr>
				`;
			});
		})
		.catch((blad) =>
			console.error('Błąd pobierania użytkowników dla admina:', blad),
		);
}

function adminUsunKsiazke(idKsiazki) {
	if (
		!confirm(
			'Czy na pewno chcesz usunąć tę książkę z systemu? (Działanie jako Administrator)',
		)
	)
		return;

	fetch(`/api/books/${idKsiazki}`, { method: 'DELETE' })
		.then((odpowiedz) => odpowiedz.json())
		.then(() => pobierzKsiazkiDlaAdmina());
}

function adminUsunUzytkownika(loginKonta) {
	if (
		!confirm(
			`UWAGA: Czy na pewno chcesz trwale usunąć konto użytkownika "${loginKonta}" i WSZYSTKIE jego książki z platformy?`,
		)
	)
		return;

	fetch(`/api/delete-account/${loginKonta}`, { method: 'DELETE' })
		.then((odpowiedz) => odpowiedz.json())
		.then(() => {
			pobierzUzytkownikowDlaAdmina();
			pobierzKsiazkiDlaAdmina();
		});
}

function adminZmienStatusBlokady(loginKonta, czyZablokowane) {
	const nowyStatusBlokady = !czyZablokowane;
	const tekstWyborny = nowyStatusBlokady ? 'zablokować' : 'odblokować';

	if (
		!confirm(
			`Czy na pewno chcesz ${tekstWyborny} konto użytkownika "${loginKonta}"?`,
		)
	)
		return;

	fetch('/api/admin/toggle-block', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			loginKonta: loginKonta,
			blokada: nowyStatusBlokady,
		}),
	})
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) alert('Błąd: ' + dane.error);
			else pobierzUzytkownikowDlaAdmina();
		})
		.catch((blad) => console.error('Błąd zmiany statusu blokady:', blad));
}

//========================

function otworzModalWymiany(idZadanejKsiazki, loginOdbiorcy) {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	if (!zalogowanyUzytkownik) {
		alert('Musisz być zalogowany, aby zaproponować wymianę!');
		window.location.href = 'zaloguj.html';
		return;
	}
	if (zalogowanyUzytkownik === loginOdbiorcy) {
		alert('Nie możesz zaproponować wymiany ze samym sobą!');
		return;
	}

	const modal = document.getElementById('modalWymiany');
	const select = document.getElementById('wymianaPropozycja');
	modal.dataset.idZadanej = idZadanejKsiazki;
	select.innerHTML = '<option value="">Ładowanie twoich książek...</option>';
	modal.style.display = 'block';

	fetch(`/api/test-books?user=${zalogowanyUzytkownik}`)
		.then((r) => r.json())
		.then((dane) => {
			if (dane.books.length === 0) {
				select.innerHTML =
					'<option value="">Nie masz książek do zaoferowania</option>';
				return;
			}
			select.innerHTML =
				'<option value="">Wybierz książkę którą oferujesz</option>';
			dane.books.forEach((k) => {
				select.innerHTML += `<option value="${k.id}">${k.tytul} — ${k.autor}</option>`;
			});
		});
}

function zamknijModalWymiany() {
	const modal = document.getElementById('modalWymiany');
	if (modal) modal.style.display = 'none';
}

function wyslijOferte() {
	const zalogowanyUzytkownik = localStorage.getItem('zalogowanyUzytkownik');
	const modal = document.getElementById('modalWymiany');
	const idZadanej = modal.dataset.idZadanej;
	const idOferowanej = document.getElementById('wymianaPropozycja').value;
	const statusDiv = document.getElementById('statusWymiany');

	if (!idOferowanej) {
		statusDiv.textContent = '❌ Wybierz książkę do zaoferowania!';
		statusDiv.style.color = '#dc2626';
		return;
	}

	fetch('/api/wymiany', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id_ksiazki_oferowanej: idOferowanej,
			id_ksiazki_zadanej: idZadanej,
			login_nadawcy: zalogowanyUzytkownik,
		}),
	})
		.then((r) => r.json())
		.then((dane) => {
			if (dane.error) {
				statusDiv.textContent = '❌ ' + dane.error;
				statusDiv.style.color = '#dc2626';
			} else {
				statusDiv.textContent = '✅ Oferta wysłana!';
				statusDiv.style.color = '#10b981';
				setTimeout(zamknijModalWymiany, 1500);
			}
		});
}

function pobierzPrzychodzaceWymiany() {
	const kontener = document.getElementById('wymianyCont');
	if (!kontener) return;
	const user = localStorage.getItem('zalogowanyUzytkownik');

	fetch(`/api/wymiany?user=${user}`)
		.then((r) => r.json())
		.then((dane) => {
			kontener.innerHTML = '';
			if (dane.wymiany.length === 0) {
				kontener.innerHTML =
					'<p class="text-muted-padded">Brak nowych propozycji wymiany.</p>';
				return;
			}
			dane.wymiany.forEach((w) => {
				kontener.innerHTML += `
                    <div class="book-item">
                        <div class="book-item-info">
                            <h4>📨 Oferta od: <strong>${w.login_nadawcy}</strong></h4>
                            <p>Oferuje: <strong>${w.tytul_oferowanej}</strong> (${w.autor_oferowanej})</p>
                            <p>W zamian za Twoją: <strong>${w.tytul_zadanej}</strong></p>
                        </div>
                        <div class="book-item-status" style="display:flex;gap:8px;">
                            <button class="btn-success" onclick="odpowiedzNaWymiane(${w.id}, 'zaakceptowana')">✓ Zaakceptuj</button>
                            <button class="btn-danger-outline" onclick="odpowiedzNaWymiane(${w.id}, 'odrzucona')">✗ Odrzuć</button>
                        </div>
                    </div>`;
			});
		});
}

function odpowiedzNaWymiane(idWymiany, status) {
	const user = localStorage.getItem('zalogowanyUzytkownik');
	fetch(`/api/wymiany/${idWymiany}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status, login: user }),
	})
		.then((r) => r.json())
		.then((dane) => {
			if (dane.error) {
				alert('❌ ' + dane.error);
				return;
			}
			alert(
				status === 'zaakceptowana'
					? '✅ Wymiana zaakceptowana! Książki zostały usunięte z oferty.'
					: 'Wymiana odrzucona.',
			);
			pobierzPrzychodzaceWymiany();
			pobierzKsiazki();
			pobierzHistorieWymian();
		});
}

// historia wymian
function pobierzHistorieWymian() {
	const kontener = document.getElementById('historiaCont');
	if (!kontener) return;
	const user = localStorage.getItem('zalogowanyUzytkownik');

	fetch(`/api/wymiany/historia?user=${user}`)
		.then((r) => r.json())
		.then((dane) => {
			kontener.innerHTML = '';
			if (dane.historia.length === 0) {
				kontener.innerHTML =
					'<p class="text-muted-padded">Brak historii wymian.</p>';
				return;
			}
			dane.historia.forEach((w) => {
				const czyNadawca = w.login_nadawcy === user;
				const drugaStrona = czyNadawca ? w.login_odbiorcy : w.login_nadawcy;
				const etykietaStatusu =
					w.status === 'zakonczona'
						? '<span class="status-badge available">✓ Zakończona</span>'
						: '<span class="status-badge" style="background:#fee2e2;color:#dc2626;">✗ Odrzucona</span>';

				kontener.innerHTML += `
                    <div class="book-item">
                        <div class="book-item-info">
                            <h4>🔄 Wymiana z: <strong>${drugaStrona}</strong></h4>
                            <p>Oferowana: <strong>${w.tytul_oferowanej}</strong> (${w.autor_oferowanej})</p>
<p>Za: <strong>${w.tytul_zadanej}</strong> (${w.autor_zadanej})</p>
                            <p style="font-size:12px;color:#94a3b8;">${new Date(w.data_utworzenia).toLocaleDateString('pl-PL')}</p>
                        </div>
                        <div class="book-item-status">
                            ${etykietaStatusu}
                        </div>
                    </div>`;
			});
		});
}

// ==========================================
// FUNKCJE PANELU ADMINA - TRANSAKCJE
// ==========================================

function pobierzWymianyDlaAdmina() {
	const cialoAdminWymiany = document.getElementById('adminWymianyBody');
	const licznikAdminWymiany = document.getElementById('adminWymianyCount');
	if (!cialoAdminWymiany) return;

	fetch('/api/admin/wymiany')
		.then((odpowiedz) => odpowiedz.json())
		.then((dane) => {
			if (dane.error) {
				cialoAdminWymiany.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">Błąd: ${dane.error}</td></tr>`;
				return;
			}
			if (licznikAdminWymiany)
				licznikAdminWymiany.textContent = dane.wymiany.length;

			cialoAdminWymiany.innerHTML = '';
			if (dane.wymiany.length === 0) {
				cialoAdminWymiany.innerHTML =
					'<tr><td colspan="8" style="text-align:center;">Brak transakcji w systemie.</td></tr>';
				return;
			}

			dane.wymiany.forEach((wymiana) => {
				const dataUtworzenia = new Date(
					wymiana.data_utworzenia,
				).toLocaleDateString('pl-PL');

				// Formatowanie estetycznych etykiet dla statusu
				let etykietaStatusu = '';
				if (wymiana.status === 'oczekuje')
					etykietaStatusu =
						'<span class="status-badge" style="background:#fef08a;color:#9a3412;">Oczekuje</span>';
				else if (wymiana.status === 'zakonczona')
					etykietaStatusu =
						'<span class="status-badge available">Zakończona</span>';
				else if (wymiana.status === 'odrzucona')
					etykietaStatusu =
						'<span class="status-badge" style="background:#fee2e2;color:#dc2626;">Odrzucona</span>';
				else if (wymiana.status === 'zablokowana')
					etykietaStatusu = '<span class="status-blocked">Zablokowana</span>';
				else
					etykietaStatusu = `<span class="status-badge">${wymiana.status}</span>`;

				// Logika przycisku Blokuj/Odblokuj
				let zablokujBtn = '';
				if (wymiana.status !== 'zablokowana') {
					zablokujBtn = `<button class="btn-outline btn-sec-action" style="padding: 4px 8px; font-size: 12px; margin: 0;" onclick="adminZmienStatusWymiany(${wymiana.id}, 'zablokowana')">Zablokuj</button>`;
				} else {
					zablokujBtn = `<button class="btn-success btn-sec-action" style="padding: 4px 8px; font-size: 12px; margin: 0;" onclick="adminZmienStatusWymiany(${wymiana.id}, 'odrzucona')">Odblokuj (Odrzuć)</button>`;
				}

				cialoAdminWymiany.innerHTML += `
					<tr>
						<td>#${wymiana.id}</td>
						<td>${dataUtworzenia}</td>
						<td><strong>${wymiana.login_nadawcy}</strong></td>
						<td><strong>${wymiana.login_odbiorcy}</strong></td>
						<td>${wymiana.tytul_oferowanej}</td>
						<td>${wymiana.tytul_zadanej}</td>
						<td>${etykietaStatusu}</td>
						<td>
                            <div style="display: flex; gap: 5px;">
							    ${zablokujBtn}
							    <button class="btn-danger-outline btn-sec-action" style="padding: 4px 8px; font-size: 12px; margin: 0;" onclick="adminUsunWymiane(${wymiana.id})">Usuń</button>
                            </div>
						</td>
					</tr>
				`;
			});
		})
		.catch((blad) =>
			console.error('Błąd pobierania transakcji dla admina:', blad),
		);
}

function adminZmienStatusWymiany(idWymiany, nowyStatus) {
	if (
		!confirm(
			`Czy na pewno chcesz zmienić status tej transakcji na: ${nowyStatus.toUpperCase()}? (Opcja zablokuj uniemożliwia realizację akcji)`,
		)
	)
		return;

	fetch(`/api/admin/wymiany/${idWymiany}/status`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status: nowyStatus }),
	})
		.then((r) => r.json())
		.then((dane) => {
			if (dane.error) alert('Błąd: ' + dane.error);
			else pobierzWymianyDlaAdmina();
		});
}

function adminUsunWymiane(idWymiany) {
	if (
		!confirm(
			'UWAGA: Czy na pewno chcesz trwale usunąć tę transakcję z bazy danych? Ta akcja jest nieodwracalna.',
		)
	)
		return;

	fetch(`/api/admin/wymiany/${idWymiany}`, { method: 'DELETE' })
		.then((r) => r.json())
		.then((dane) => {
			if (dane.error) alert('Błąd: ' + dane.error);
			else pobierzWymianyDlaAdmina();
		});
}
