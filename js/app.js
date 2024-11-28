// Fetch and display books on the grid
fetch('books.json')
  .then(response => response.json())
  .then(data => {
    const grid = document.getElementById('bookGrid');
    data.forEach(book => {
      const bookDiv = document.createElement('div');
      bookDiv.innerHTML = `
        <a href="book.html?id=${book.id}">
          <img src="${book.cover}" alt="${book.title}">
        </a>
      `;
      grid.appendChild(bookDiv);
    });
  })
  .catch(err => console.error('Error fetching book data:', err));