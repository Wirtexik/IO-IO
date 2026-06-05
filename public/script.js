document.addEventListener('DOMContentLoaded', () => {
	if (document.getElementById('booksBody')) {
		fetchBooks();
	}
	if (document.getElementById('wishlistBody')) {
		fetchWishlist();
	}

	// Obsługa losowych książek na stronie głównej
	if (document.getElementById('randomBooksBody')) {
		fetchRandomBooks();
	}

	// OBSŁUGA KLIKNIĘCIA "SZUKAJ" NA STRONIE GŁÓWNEJ
	const homeSearchBtn = document.getElementById('home-search-btn');
	if (homeSearchBtn) {
		homeSearchBtn.addEventListener('click', () => {
			const searchInput = document.getElementById('home-search');
			const categorySelect = document.getElementById('home-category');

			// Bezpieczne pobranie wartości (zapobiega błędom w konsoli)
			const searchVal = searchInput ? searchInput.value : '';
			const categoryVal = categorySelect ? categorySelect.value : '';

			const params = new URLSearchParams();
			if (searchVal) params.append('search', searchVal);
			if (categoryVal) params.append('category', categoryVal);

			// Przekierowanie na podstronę aukcji z parametrami
			window.location.href = `aukcje.html?${params.toString()}`;
		});
	}

	// OBSŁUGA STRONY AUKCJI I PARAMETRÓW Z LINKU
	const auctionsBody = document.getElementById('auctionsBody');
	if (auctionsBody) {
		const filterBtn = document.getElementById('apply-filters-btn');
		if (filterBtn) {
			filterBtn.addEventListener('click', fetchAuctions);
		}

		// Odczytujemy parametry przekazane z paska URL
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.has('search') || urlParams.has('category')) {
			const querySearch = urlParams.get('search') || '';
			const queryCategory = urlParams.get('category') || '';

			const searchTitleInput = document.getElementById('search-title');
			const filterCategorySelect = document.getElementById('filter-category');

			// BARDZO WAŻNE: Uzupełniamy pola tylko wtedy, gdy na pewno istnieją na stronie!
			if (searchTitleInput) searchTitleInput.value = querySearch;
			if (filterCategorySelect) filterCategorySelect.value = queryCategory;

			// Automatycznie zaciągamy książki
			fetchAuctions();
		}
	}

	// Obsługa ukrywania/pokazywania pola "ilość" w oknie dodawania książki (Dla shelf.html)
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

function setupNavbarAuth() {
	const loggedInUser = localStorage.getItem('loggedInUser');
	const navLinks = document.querySelectorAll('.nav-links a');
	let loginLink = null;

	navLinks.forEach((link) => {
		if (
			link.getAttribute('href') === 'profil.html' ||
			link.getAttribute('href') === 'zaloguj.html'
		) {
			loginLink = link;
		}
	});

	if (loggedInUser && loginLink) {
		loginLink.textContent = loggedInUser;
		loginLink.setAttribute('href', 'profil.html');
		loginLink.classList.remove('active-link');
	}
}

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

function logout() {
	localStorage.removeItem('loggedInUser');
	localStorage.removeItem('loggedInUserEmail');
	localStorage.removeItem('registeredUserEmail');
	window.location.href = 'zaloguj.html';
}

function loadProfileData() {
	const loggedInUser = localStorage.getItem('loggedInUser');
	if (!loggedInUser) return;

	fetch(`/api/profile?user=${loggedInUser}`)
		.then((res) => res.json())
		.then((data) => {
			if (data.error) return;

			// 1. Aktualizacja górnej wizytówki profilu
			const locationEl = document.getElementById('displayLocation');
			const phoneEl = document.getElementById('displayPhone');
			const emailEl = document.getElementById('profileEmail');

			if (emailEl) emailEl.textContent = data.email || 'Brak e-maila';
			if (locationEl) {
				if (data.miasto || data.kod_pocztowy) {
					locationEl.innerHTML =
						`<span>📍</span> ${data.miasto || ''} ${data.kod_pocztowy || ''}`.trim();
				} else {
					locationEl.innerHTML = `<span>📍</span> Nie podano lokalizacji`;
				}
			}
			if (phoneEl) {
				phoneEl.innerHTML = `<span>📱</span> ${data.telefon || 'Brak numeru telefonu'}`;
			}

			// 2. Wypełnienie formularza w Ustawieniach
			if (document.getElementById('set-imie'))
				document.getElementById('set-imie').value = data.imie || '';
			if (document.getElementById('set-nazwisko'))
				document.getElementById('set-nazwisko').value = data.nazwisko || '';
			if (document.getElementById('set-telefon'))
				document.getElementById('set-telefon').value = data.telefon || '';
			if (document.getElementById('set-miasto'))
				document.getElementById('set-miasto').value = data.miasto || '';
			if (document.getElementById('set-kod'))
				document.getElementById('set-kod').value = data.kod_pocztowy || '';
			if (document.getElementById('set-opis'))
				document.getElementById('set-opis').value = data.opis || '';
		})
		.catch((err) => console.error('Błąd ładowania profilu:', err));
}

function saveSettings() {
	const loggedInUser = localStorage.getItem('loggedInUser');
	if (!loggedInUser) {
		alert('Musisz być zalogowany!');
		return;
	}

	const profileData = {
		login: loggedInUser,
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
		body: JSON.stringify(profileData),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				alert('❌ Błąd zapisu: ' + data.error);
			} else {
				alert('✅ ' + data.message);
				loadProfileData(); // Odświeżenie pól wizytówki nowymi danymi
			}
		})
		.catch((err) => console.error('Błąd zapisywania profilu:', err));
}

function openModal(targetDestination) {
	const modal = document.getElementById('addBookModal');
	if (modal) {
		modal.style.display = 'block';
		const statusDiv = document.getElementById('addStatus');
		if (statusDiv) statusDiv.textContent = '';

		// ZMIANA: Obsługa ukrytego pola destination i ilości na podstawie przekazanego parametru
		if (targetDestination) {
			const destInput = document.getElementById('destination');
			const iloscInput = document.getElementById('ilosc');

			if (destInput) {
				destInput.value = targetDestination;
			}

			if (iloscInput) {
				if (targetDestination === 'wishlist') {
					iloscInput.style.display = 'none';
					iloscInput.removeAttribute('required');
				} else {
					iloscInput.style.display = 'block';
					iloscInput.setAttribute('required', 'required');
				}
			}
		}
	}
}

function closeModal() {
	const modal = document.getElementById('addBookModal');
	if (modal) modal.style.display = 'none';
}

function openPasswordModal() {
	const modal = document.getElementById('changePasswordModal');
	if (modal) {
		modal.style.display = 'block';
		const statusDiv = document.getElementById('passwordStatus');
		if (statusDiv) statusDiv.textContent = '';
	}
}

function closePasswordModal() {
	const modal = document.getElementById('changePasswordModal');
	if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
	let addBookModal = document.getElementById('addBookModal');
	let registerModal = document.getElementById('registerSuccessModal');
	let passwordModal = document.getElementById('changePasswordModal');

	if (event.target == addBookModal) {
		addBookModal.style.display = 'none';
	}
	if (event.target == registerModal) {
		closeRegisterSuccessModal();
	}
	if (event.target == passwordModal) {
		closePasswordModal();
	}
};

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

const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
	changePasswordForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const loggedInUser = localStorage.getItem('loggedInUser');
		if (!loggedInUser) return;

		const oldPassword = document.getElementById('old-password').value;
		const newPassword = document.getElementById('new-password').value;
		const newPasswordConfirm = document.getElementById(
			'new-password-confirm',
		).value;
		const statusDiv = document.getElementById('passwordStatus');

		if (newPassword !== newPasswordConfirm) {
			statusDiv.textContent = '❌ Nowe hasła nie są identyczne!';
			statusDiv.style.color = '#dc2626';
			return;
		}

		fetch('/api/change-password', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				login: loggedInUser,
				stareHaslo: oldPassword,
				noweHaslo: newPassword,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					statusDiv.textContent = '❌ ' + data.error;
					statusDiv.style.color = '#dc2626';
				} else {
					statusDiv.textContent = '✅ ' + data.message;
					statusDiv.style.color = '#10b981';
					changePasswordForm.reset();
					setTimeout(closePasswordModal, 1500);
				}
			})
			.catch((err) => {
				statusDiv.textContent = '❌ Błąd połączenia z serwerem.';
				statusDiv.style.color = '#dc2626';
			});
	});
}

function deleteAccount() {
	const loggedInUser = localStorage.getItem('loggedInUser');
	if (!loggedInUser) return;

	if (
		confirm(
			'⚠️ UWAGA: Czy na pewno chcesz trwale usunąć swoje konto? Ta operacja usunie wszystkie Twoje dane oraz wystawione książki. Nie można tego cofnąć!',
		)
	) {
		fetch(`/api/delete-account/${loggedInUser}`, { method: 'DELETE' })
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					alert('❌ Błąd usuwania konta: ' + data.error);
				} else {
					alert('✅ ' + data.message);
					logout(); // Wylogowuje użytkownika (czyści local storage i przekierowuje)
				}
			})
			.catch((err) => console.error('Błąd podczas usuwania konta: ', err));
	}
}

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
			const userNameEl = document.getElementById('userName');
			const avatarDisplayEl = document.getElementById('avatarDisplay');

			if (userNameEl) userNameEl.textContent = loggedInUser;
			if (avatarDisplayEl)
				avatarDisplayEl.textContent = loggedInUser.charAt(0).toUpperCase();

			loadProfileData();
		}
	}
});

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

function handleRegister(e) {
	e.preventDefault();
	const login = document.getElementById('reg-login').value;
	const email = document.getElementById('reg-email').value;
	const haslo = document.getElementById('reg-haslo').value;
	const haslo2 = document.getElementById('reg-haslo2').value;
	const errorDiv = document.getElementById('reg-error');

	errorDiv.style.display = 'none';

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

function closeRegisterSuccessModal() {
	const modal = document.getElementById('registerSuccessModal');
	if (modal) {
		modal.style.display = 'none';
		switchAuthTab('login');
	}
}

function fetchAuctions() {
	const auctionsBody = document.getElementById('auctionsBody');
	const resultsCount = document.getElementById('results-count');
	if (!auctionsBody) return;

	const searchInput = document.getElementById('search-title')?.value || '';
	const categorySelect =
		document.getElementById('filter-category')?.value || '';
	const conditionSelect =
		document.getElementById('filter-condition')?.value || '';

	const params = new URLSearchParams({
		search: searchInput,
		category: categorySelect,
		condition: conditionSelect,
	});

	fetch(`/api/auctions?${params.toString()}`)
		.then((response) => response.json())
		.then((data) => {
			if (resultsCount) resultsCount.textContent = data.books.length;

			auctionsBody.innerHTML = '';

			if (data.books.length === 0) {
				auctionsBody.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px;">
                        Brak dostępnych ofert spełniających wybrane kryteria filtrów.
                    </p>
                `;
				return;
			}

			data.books.forEach((k) => {
				const firstLetter = k.tytul.charAt(0).toUpperCase();

				auctionsBody.innerHTML += `
             <div class="book-card">
                        <div class="card-img">${firstLetter}</div>
                        <div class="card-content">
                            <h3 style="margin-bottom: 5px;">${k.tytul}</h3>
                            <p style="color: #64748b; margin-bottom: 5px;">${k.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 10px;">Stan: ${k.stan}</p>
                            
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 15px; font-size: 13px; color: #475569;">
                                <span>👤 Wystawia:</span>
                                <strong>${k.wlasciciel}</strong>
                            </div>

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

function fetchRandomBooks() {
	const randomBody = document.getElementById('randomBooksBody');
	if (!randomBody) return;

	fetch('/api/random-books')
		.then((response) => response.json())
		.then((data) => {
			randomBody.innerHTML = '';

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
                            <p style="color: #64748b; margin-bottom: 5px;">${k.autor}</p>
                            <p style="color: #10b981; font-weight: 600; font-size: 13px; margin-bottom: 10px;">Stan: ${k.stan}</p>
                            
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 15px; font-size: 13px; color: #475569;">
                                <span>👤 Wystawia:</span>
                                <strong>${k.wlasciciel}</strong>
                            </div>

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
