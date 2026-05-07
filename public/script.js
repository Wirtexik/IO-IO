function fetchBooks() {
    const statusBox = document.getElementById('statusBox');
    const serverStatus = document.getElementById('serverStatus');
    const dbStatus = document.getElementById('dbStatus');
    const table = document.getElementById('booksTable');
    const tbody = document.getElementById('booksBody');

    // 1. Ustawienie statusów początkowych (oczekiwanie)
    statusBox.style.display = 'block';
    table.style.display = 'none'; 
    
    serverStatus.textContent = '⏳ Łączenie z serwerem...';
    serverStatus.style.color = '#64748b';
    
    dbStatus.textContent = '⏳ Oczekiwanie na bazę danych...';
    dbStatus.style.color = '#64748b';

    // 2. Wywołanie backendu
    fetch('/api/test-books')
        .then(response => {
            // Serwer odpowiedział!
            serverStatus.textContent = '✅ Połączono z serwerem!';
            serverStatus.style.color = '#16a34a';

            if (!response.ok) {
                dbStatus.textContent = '❌ Błąd połączenia z bazą danych!';
                dbStatus.style.color = '#dc2626';
                throw new Error('Błąd bazy danych');
            }
            
            // Baza działa!
            dbStatus.textContent = '✅ Połączono z bazą danych!';
            dbStatus.style.color = '#16a34a';
            
            return response.json();
        })
        .then(data => {
            // 3. Wypełnianie tabeli
            tbody.innerHTML = '';
            data.books.forEach(ksiazka => {
                const wiersz = `
                    <tr>
                        <td>${ksiazka.id}</td>
                        <td>${ksiazka.tytul}</td>
                        <td>${ksiazka.autor}</td>
                        <td>${ksiazka.kategoria}</td>
                        <td>${ksiazka.stan}</td>
                        <td>${ksiazka.ilosc}</td>
                    </tr>
                `;
                tbody.innerHTML += wiersz;
            });
            table.style.display = 'table';
        })
        .catch(error => {
            if (serverStatus.textContent.includes('⏳')) {
                serverStatus.textContent = '❌ Brak połączenia z serwerem!';
                serverStatus.style.color = '#dc2626';
                dbStatus.textContent = '❌ Nie można sprawdzić bazy danych!';
                dbStatus.style.color = '#dc2626';
            }
            console.error('Wystąpił błąd:', error);
        });
}