document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('booksBody')) {
        fetchBooks();
    }
    if (document.getElementById('wishlistBody')) {
        fetchWishlist();
    }
    
    const destSelect = document.getElementById('destination');
    const iloscInput = document.getElementById('ilosc');
    if (destSelect && iloscInput) {
        destSelect.addEventListener('change', function() {
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

    navLinks.forEach(link => {
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

function openModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.style.display = "block";
        document.getElementById('addStatus').textContent = "";
    }
}

function closeModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) modal.style.display = "none";
}

window.onclick = function(event) {
    let modal = document.getElementById('addBookModal');
    let logoutModal = document.getElementById('logoutModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
    if (event.target == logoutModal) {
        logoutModal.style.display = "none";
    }
}

const addBookForm = document.getElementById('addBookForm');
if (addBookForm) {
    addBookForm.addEventListener('submit', function(e) {
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
            ilosc: document.getElementById('ilosc').value,
            wlasciciel: loggedInUser
        };

        fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                status.textContent = "❌ " + data.error;
                status.style.color = '#dc2626';
            } else {
                status.textContent = "✅ " + data.message;
                status.style.color = '#10b981';
                
                document.getElementById('addBookForm').reset();
                document.getElementById('ilosc').style.display = 'block';
                
                fetchBooks();
                fetchWishlist();
                
                setTimeout(closeModal, 1500);
            }
        })
        .catch(err => {
            status.textContent = "❌ Błąd serwera";
            status.style.color = '#dc2626';
        });
    });
}

function fetchBooks() {
    const tbody = document.getElementById('booksBody');
    if (!tbody) return;

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        tbody.innerHTML = '<p style="color: #64748b; font-size: 14px; padding: 10px;">Zaloguj się, aby zobaczyć swoją półkę.</p>';
        return;
    }

    fetch(`/api/test-books?user=${loggedInUser}`)
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.books.length === 0) {
                tbody.innerHTML = '<p style="color: #64748b; font-size: 14px; padding: 10px;">Twoja półka ofert jest pusta.</p>';
                return;
            }
            data.books.forEach(k => {
                const firstLetter = k.tytul.charAt(0).toUpperCase();
                tbody.innerHTML += `
                    <div class="list-item">
                        <div class="item-icon">${firstLetter}</div>
                        <div class="item-details">
                            <h4>${k.tytul}</h4>
                            <p>${k.autor} • <span style="color: #64748b; font-size:12px;">Sztuk: ${k.ilosc} (Stan: ${k.stan})</span></p>
                        </div>
                        <button class="btn-danger-outline" onclick="deleteBook(${k.id})">Usuń</button>
                    </div>
                `;
            });
        });
}

function fetchWishlist() {
    const tbody = document.getElementById('wishlistBody');
    if (!tbody) return;

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        tbody.innerHTML = '<p style="color: #64748b; font-size: 14px; padding: 10px;">Zaloguj się, aby zobaczyć swoją listę życzeń.</p>';
        return;
    }

    fetch(`/api/wishlist?user=${loggedInUser}`)
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.books.length === 0) {
                tbody.innerHTML = '<p style="color: #64748b; font-size: 14px; padding: 10px;">Twoja lista życzeń jest pusta.</p>';
                return;
            }
            data.books.forEach(k => {
                const firstLetter = k.tytul.charAt(0).toUpperCase();
                tbody.innerHTML += `
                    <div class="list-item">
                        <div class="item-icon" style="background: #cbd5e1;">${firstLetter}</div>
                        <div class="item-details">
                            <h4>${k.tytul}</h4>
                            <p>${k.autor} • <span style="color: #64748b; font-size:12px;">Stan: ${k.stan}</span></p>
                        </div>
                        <button class="btn-danger-outline" onclick="deleteWishlistItem(${k.id})">Usuń</button>
                    </div>
                `;
            });
        });
}

function deleteBook(id) {
    if (!confirm('Czy na pewno chcesz usunąć tę książkę z półki ofert?')) return;

    fetch(`/api/books/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => fetchBooks());
}

function deleteWishlistItem(id) {
    if (!confirm('Czy na pewno chcesz usunąć tę książkę z listy życzeń?')) return;

    fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => fetchWishlist());
}