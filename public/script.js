/*
 * ==========================================================================
 * INSTANT BOOK EXCHANGE - GLÓWNY PLIK LOGIKI JAVASCRIPT
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
	if (document.getElementById('booksBody')) {
		fetchBooks();
	}
	if (document.getElementById('wishlistBody')) {
		fetchWishlist();
	}

	// NOWE: Obsługa losowych książek na stronie głównej
	if (document.getElementById('randomBooksBody')) {
		fetchRandomBooks();
	}

	// NOWE: Obsługa inicjalizacji strony z aukcjami
	if (document.getElementById('auctionsBody')) {
		// Podpięcie funkcji filtrującej WYŁĄCZNIE pod kliknięcie przycisku
		const filterBtn = document.getElementById('apply-filters-btn');
		if (filterBtn) {
			filterBtn.addEventListener('click', fetchAuctions);
		}
	}

	// Obsługa ukrywania/pokazywania pola "ilość" w oknie dodawania książki
	const destSelect = document.getElementById('destination');
	const iloscInput = document.getElementById('ilosc');
	if (destSelect && iloscInput) {
		destSelect.addEventListener('change', function () {
			if (this.value === 'wishlist') {
				iloscInput.style.display = 'none';
				iloscInput.removeAttribute('required');
			} else {
				iloscInput.style.display = 'block';
				iloscInput.setAttribute('required', 'required');
			}
		});
	}

	setupNavbarAuth();
});

/*
 ZARZĄDZANIE SESJĄ W NAWIGACJI
 */
function setupNavbarAuth() {
	const loggedInUser = localStorage.getItem('loggedInUser');
	const navLinks = document.querySelectorAll('.nav-links a');
	let loginLink = null;

	navLinks.forEach((link) => {
		if (link.getAttribute('href') === 'profil.html') {
			loginLink = link;
		}
	});

	if (loggedInUser && loginLink) {
		loginLink.textContent = loggedInUser;
		loginLink.setAttribute('href', 'profil.html');
		loginLink.classList.remove('active-link');
	}
}

/*
 PRZEŁĄCZANIE ZAKŁADEK W PROFILU UŻYTKOWNIKA
 */
function switchTab(tabName, event) {
	const tabs = document.querySelectorAll('.tab-content');
	tabs.forEach((tab) => tab.classList.remove('active'));

	const buttons = document.querySelectorAll('.tab-button');
	buttons.forEach((btn) => btn.classList.remove('active'));

	document.getElementById('tab-' + tabName).classList.add('active');
	if (event && event.target) {
		event.target.classList.add('active');
	}
}

/*
WYLOGOWYWANIE Z APLIKACJI
 */
function logout() {
	localStorage.removeItem('loggedInUser');
	localStorage.removeItem('loggedInUserEmail');
	localStorage.removeItem('registeredUserEmail');
	window.location.href = 'zaloguj.html';
}

function saveSettings() {
	alert('Zmiany zostały zapisane lokalnie!');
}

/*
OBSŁUGA OKIEN WYSKAKUJĄCYCH (MODALI)
 */
function openModal() {
	const modal = document.getElementById('addBookModal');
	if (modal) {
		modal.style.display = 'block';
		const statusDiv = document.getElementById('addStatus');
		if (statusDiv) statusDiv.textContent = '';
	}
}

function closeModal() {
	const modal = document.getElementById('addBookModal');
	if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
	let addBookModal = document.getElementById('addBookModal');
	let registerModal = document.getElementById('registerSuccessModal');

	if (event.target == addBookModal) {
		addBookModal.style.display = 'none';
	}
	if (event.target == registerModal) {
		closeRegisterSuccessModal();
	}
};

/*
 POST: DODAWANIE NOWEJ KSIĄŻKI DO BAZY DANYCH
 */
const addBookForm = document.getElementById('addBookForm');
if (addBookForm) {
	addBookForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const loggedInUser = localStorage.getItem('loggedInUser');
		if (!loggedInUser) {
			alert('Musisz się zalogować, aby dodać książkę!');
			return;
		}

		const status = document.getElementById('addStatus');
		const formData = {
			destination: document.getElementById('destination').value,
			tytul: document.getElementById('tytul').value,
			autor: document.getElementById('autor').value,
			kategoria: document.getElementById('kategoria').value,
			stan: document.getElementById('stan').value,
			ilosc: document.getElementById('ilosc')
				? document.getElementById('ilosc').value
				: 1,
			wlasciciel: loggedInUser,
		};

		fetch('/api/books', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					status.textContent = '❌ ' + data.error;
					status.style.color = '#dc2626';
				} else {
					status.textContent = '✅ ' + data.message;
					status.style.color = '#10b981';

					document.getElementById('addBookForm').reset();
					if (document.getElementById('ilosc')) {
						document.getElementById('ilosc').style.display = 'block';
					}

					fetchBooks();
					fetchWishlist();
					setTimeout(closeModal, 1500);
				}
			})
			.catch((err) => {
				status.textContent = '❌ Błąd połączenia z serwerem';
				status.style.color = '#dc2626';
			});
	});
}

/*
 GET: POBIERANIE OFEROWANYCH KSIĄŻEK Z BAZY
 */
function fetchBooks() {
	const tbody = document.getElementById('booksBody');
	if (!tbody) return;

	const loggedInUser = localStorage.getItem('loggedInUser');
	if (!loggedInUser) {
		tbody.innerHTML =
			'<p class="text-muted-padded">Zaloguj się, aby zobaczyć swoją półkę.</p>';
		return;
	}

	fetch(`/api/test-books?user=${loggedInUser}`)
		.then((response) => response.json())
		.then((data) => {
			// Statystyki widoczne na stronie profil.html
			const statBooksEl = document.getElementById('statBooks');
			const booksCountEl = document.getElementById('booksCount');
			if (statBooksEl) statBooksEl.textContent = data.books.length;
			if (booksCountEl) booksCountEl.textContent = data.books.length;

			tbody.innerHTML = '';

			if (data.books.length === 0) {
				if (statBooksEl) {
					tbody.innerHTML =
						'<div class="empty-state"><div class="empty-state-icon">📚</div><h3>Brak książek</h3><p>Dodaj swoją pierwszą książkę do oferty!</p></div>';
				} else {
					tbody.innerHTML =
						'<p class="text-muted-padded">Twoja półka ofert jest pusta.</p>';
				}
				return;
			}

			data.books.forEach((k) => {
				const firstLetter = k.tytul.charAt(0).toUpperCase();

				if (statBooksEl) {
					// Wygląd dla zakładki w Profilu
					tbody.innerHTML += `
                        <div class="book-item">
                            <div class="flex-gap-15">
                                <div class="item-icon">${firstLetter}</div>
                                <div class="book-item-info">
                                    <h4>${k.tytul}</h4>
                                    <p>${k.autor}</p>
                                    <p>Kategoria: ${k.kategoria} • Stan: ${k.stan} • Sztuk: ${k.ilosc}</p>
                                </div>
                            </div>
                            <div class="book-item-status">
                                <span class="status-badge available">✓ Dostępne</span>
                                <button class="btn-danger-outline" onclick="deleteBook(${k.id})">Usuń</button>
                            </div>
                        </div>
                    `;
				} else {
					// Wygląd dla widoku na stronie Głównej/Półce
					tbody.innerHTML += `
                        <div class="list-item">
                            <div class="item-icon">${firstLetter}</div>
                            <div class="item-details">
                                <h4>${k.tytul}</h4>
                                <p>${k.autor} • <span class="text-muted-sm">Sztuk: ${k.ilosc} (Stan: ${k.stan})</span></p>
                            </div>
                            <button class="btn-danger-outline" onclick="deleteBook(${k.id})">Usuń</button>
                        </div>
                    `;
				}
			});
		});
}

/*
 GET: POBIERANIE KSIĄŻEK Z LISTY ŻYCZEŃ
 */
function fetchWishlist() {
	const tbody = document.getElementById('wishlistBody');
	if (!tbody) return;

	const loggedInUser = localStorage.getItem('loggedInUser');
	if (!loggedInUser) {
		tbody.innerHTML =
			'<p class="text-muted-padded">Zaloguj się, aby zobaczyć swoją listę życzeń.</p>';
		return;
	}

	fetch(`/api/wishlist?user=${loggedInUser}`)
		.then((response) => response.json())
		.then((data) => {
			const statWishlistEl = document.getElementById('statWishlist');
			const wishlistCountEl = document.getElementById('wishlistCount');
			if (statWishlistEl) statWishlistEl.textContent = data.books.length;
			if (wishlistCountEl) wishlistCountEl.textContent = data.books.length;

			tbody.innerHTML = '';

			if (data.books.length === 0) {
				if (statWishlistEl) {
					tbody.innerHTML =
						'<div class="empty-state"><div class="empty-state-icon">❤️</div><h3>Pusta lista życzeń</h3><p>Dodaj książki, aby śledzić interesujące Tytuły!</p></div>';
				} else {
					tbody.innerHTML =
						'<p class="text-muted-padded">Twoja lista życzeń jest pusta.</p>';
				}
				return;
			}

			data.books.forEach((k) => {
				const firstLetter = k.tytul.charAt(0).toUpperCase();

				if (statWishlistEl) {
					// Wygląd dla Profilu
					tbody.innerHTML += `
                        <div class="book-item">
                            <div class="flex-gap-15">
                                <div class="item-icon wishlist-icon-bg">${firstLetter}</div>
                                <div class="book-item-info">
                                    <h4>${k.tytul}</h4>
                                    <p>${k.autor}</p>
                                    <p>Stan: ${k.stan} • Kategoria: ${k.kategoria}</p>
                                </div>
                            </div>
                            <div class="book-item-status">
                                <span class="status-badge">Szukane</span>
                                <button class="btn-danger-outline" onclick="deleteWishlistItem(${k.id})">Usuń</button>
                            </div>
                        </div>
                    `;
				} else {
					// Wygląd dla Mojej Półki
					tbody.innerHTML += `
                        <div class="list-item">
                            <div class="item-icon wishlist-icon-bg">${firstLetter}</div>
                            <div class="item-details">
                                <h4>${k.tytul}</h4>
                                <p>${k.autor} • <span class="text-muted-sm">Stan: ${k.stan}</span></p>
                            </div>
                            <button class="btn-danger-outline" onclick="deleteWishlistItem(${k.id})">Usuń</button>
                        </div>
                    `;
				}
			});
		});
}

/**
DELETE: USUWANIE REKORDÓW Z BAZY 
 */
function deleteBook(id) {
	if (!confirm('Czy na pewno chcesz usunąć tę książkę z półki ofert?')) return;

	fetch(`/api/books/${id}`, { method: 'DELETE' })
		.then((res) => res.json())
		.then(() => {
			fetchBooks();
			fetchWishlist();
		});
}

function deleteWishlistItem(id) {
	if (!confirm('Czy na pewno chcesz usunąć tę książkę z listy życzeń?')) return;

	fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
		.then((res) => res.json())
		.then(() => {
			fetchBooks();
			fetchWishlist();
		});
}

document.addEventListener('DOMContentLoaded', () => {
	const loggedInUser = localStorage.getItem('loggedInUser');

	if (window.location.pathname.includes('profil.html')) {
		if (!loggedInUser) {
			window.location.href = 'zaloguj.html';
		} else {
			const loggedInEmail =
				localStorage.getItem('loggedInUserEmail') ||
				localStorage.getItem('registeredUserEmail') ||
				'';
			const userNameEl = document.getElementById('userName');
			const avatarDisplayEl = document.getElementById('avatarDisplay');
			const profileEmailEl = document.getElementById('profileEmail');

			if (userNameEl) userNameEl.textContent = loggedInUser;
			if (avatarDisplayEl)
				avatarDisplayEl.textContent = loggedInUser.charAt(0).toUpperCase();
			if (profileEmailEl)
				profileEmailEl.textContent = loggedInEmail || 'Brak adresu e-mail';
		}
	}
});
/*
 ============================================
 LOGIKA AUTORYZACJI (LOGOWANIE I REJESTRACJA)
 ============================================
 */

/*
 Przełączanie między formularzem logowania a rejestracji.
 */
function switchAuthTab(tab) {
	const tabs = document.querySelectorAll('.auth-tab');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');

	if (!loginForm || !registerForm) return;

	if (tab === 'login') {
		tabs[0].classList.add('active');
		tabs[1].classList.remove('active');
		loginForm.classList.add('active');
		registerForm.classList.remove('active');
	} else {
		tabs[0].classList.remove('active');
		tabs[1].classList.add('active');
		loginForm.classList.remove('active');
		registerForm.classList.add('active');
	}
}

/*
 Obsługa zapytania logowania (POST /api/login)
 */
function handleLogin(e) {
	e.preventDefault();
	const login = document.getElementById('login-input').value;
	const haslo = document.getElementById('login-haslo').value;
	const errorDiv = document.getElementById('login-error');

	errorDiv.style.display = 'none';

	fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ login, haslo }),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				errorDiv.textContent = '❌ ' + data.error;
				errorDiv.style.display = 'block';
			} else {
				// Zapisanie sesji w pamięci przeglądarki i przekierowanie
				localStorage.setItem('loggedInUser', data.login);
				if (data.email) {
					localStorage.setItem('loggedInUserEmail', data.email);
				}
				window.location.href = 'profil.html';
			}
		})
		.catch((err) => {
			errorDiv.textContent = '❌ Błąd połączenia z serwerem.';
			errorDiv.style.display = 'block';
		});
}

/*
 Obsługa zapytania rejestracji (POST /api/register)
 */
function handleRegister(e) {
	e.preventDefault();
	const login = document.getElementById('reg-login').value;
	const email = document.getElementById('reg-email').value;
	const haslo = document.getElementById('reg-haslo').value;
	const haslo2 = document.getElementById('reg-haslo2').value;
	const errorDiv = document.getElementById('reg-error');

	errorDiv.style.display = 'none';

	// Walidacja zgodności haseł
	if (haslo !== haslo2) {
		errorDiv.textContent = '❌ Hasła nie są identyczne!';
		errorDiv.style.display = 'block';
		return;
	}

	fetch('/api/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ login, email, haslo }),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				errorDiv.textContent = '❌ ' + data.error;
				errorDiv.style.display = 'block';
			} else {
				// Rejestracja udana
				localStorage.setItem('registeredUserEmail', email);
				document.getElementById('registerSuccessModal').style.display = 'block';
				document.getElementById('register-form').reset();
			}
		})
		.catch((err) => {
			errorDiv.textContent = '❌ Błąd połączenia z serwerem.';
			errorDiv.style.display = 'block';
		});
}

/*
 Zamykanie okna sukcesu po udanej rejestracji i przełączenie na logowanie
 */
function closeRegisterSuccessModal() {
	const modal = document.getElementById('registerSuccessModal');
	if (modal) {
		modal.style.display = 'none';
		switchAuthTab('login');
	}
}

/*
 GET: POBIERANIE DOSTĘPNYCH KSIĄŻEK NA STRONIE AUKCJI (Z UWZGLĘDNIENIEM FILTRÓW)
 */
function fetchAuctions() {
	const auctionsBody = document.getElementById('auctionsBody');
	const resultsCount = document.getElementById('results-count');
	if (!auctionsBody) return;

	// Pobranie aktualnych wartości wpisanych/wybranych przez użytkownika w formularzu bocznym
	const searchInput = document.getElementById('search-title')?.value || '';
	const categorySelect =
		document.getElementById('filter-category')?.value || '';
	const conditionSelect =
		document.getElementById('filter-condition')?.value || '';

	// Utworzenie parametrów zapytania (Query Parameters) dla adresu URL
	const params = new URLSearchParams({
		search: searchInput,
		category: categorySelect,
		condition: conditionSelect,
	});

	// Wysłanie żądania asynchronicznego do przygotowanego endpointu API
	fetch(`/api/auctions?${params.toString()}`)
		.then((response) => response.json())
		.then((data) => {
			// Aktualizacja liczby znalezionych ofert nad siatką kart
			if (resultsCount) resultsCount.textContent = data.books.length;

			// Czyszczenie dotychczasowej zawartości siatki przed wstawieniem nowych wyników
			auctionsBody.innerHTML = '';

			// Obsługa sytuacji, gdy żadna książka nie spełnia kryteriów wyszukiwania
			if (data.books.length === 0) {
				auctionsBody.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px;">
                        Brak dostępnych ofert spełniających wybrane kryteria filtrów.
                    </p>
                `;
				return;
			}

			// Iteracja po tablicy zwróconych książek i generowanie kodu HTML kart
			data.books.forEach((k) => {
				const firstLetter = k.tytul.charAt(0).toUpperCase();

				// Używamy klas cards-grid, card-img, card-content ze strony głównej!
				auctionsBody.innerHTML += `
                    <div class="book-card">
                        <div class="card-img">${firstLetter}</div>
                        <div class="card-content">
                            <h3 style="margin-bottom: 5px;">${k.tytul}</h3>
                            <p style="color: #64748b; margin-bottom: 10px;">${k.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 15px;">Stan: ${k.stan}</p>
                            <button class="btn-outline" onclick="alert('Funkcja składania ofert wymiany jest w trakcie budowy!')">
                                Zaproponuj wymianę
                            </button>
                        </div>
                    </div>
                `;
			});
		})
		.catch((err) => {
			console.error('Błąd pobierania aukcji:', err);
			auctionsBody.innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 20px;">
                    Wystąpił problem podczas komunikacji z serwerem.
                </p>
            `;
		});
}

/*
 GET: POBIERANIE LOSOWYCH KSIĄŻEK NA STRONĘ GŁÓWNĄ
 */
function fetchRandomBooks() {
	const randomBody = document.getElementById('randomBooksBody');
	if (!randomBody) return;

	fetch('/api/random-books')
		.then((response) => response.json())
		.then((data) => {
			randomBody.innerHTML = ''; // Wyczyszczenie napisu "Ładowanie..."

			if (data.books.length === 0) {
				randomBody.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">
                        Brak dostępnych ofert. Bądź pierwszą osobą, która doda książkę do wymiany!
                    </p>
                `;
				return;
			}

			data.books.forEach((k) => {
				const firstLetter = k.tytul.charAt(0).toUpperCase();

				randomBody.innerHTML += `
                    <div class="book-card">
                        <div class="card-img">${firstLetter}</div>
                        <div class="card-content">
                            <h3 style="margin-bottom: 5px;">${k.tytul}</h3>
                            <p style="color: #64748b; margin-bottom: 10px;">${k.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 15px;">Stan: ${k.stan}</p>
                            <button class="btn-outline" onclick="alert('Funkcja składania ofert wymiany jest w trakcie budowy!')">
                                Zaproponuj wymianę
                            </button>
                        </div>
                    </div>
                `;
			});
		})
		.catch((err) => {
			console.error('Błąd pobierania losowych książek:', err);
			randomBody.innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 20px;">
                    Wystąpił błąd podczas ładowania przykładowych ofert.
                </p>
            `;
		});
}
