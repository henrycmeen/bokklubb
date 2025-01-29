// Get the current user from URL parameters or default to 'rasmus'
const params = new URLSearchParams(window.location.search);
const currentUser = params.get('user') || 'rasmus';

document.addEventListener('DOMContentLoaded', function() {
  // Function to fetch and display books
  function fetchAndDisplayBooks() {
    fetch('/.netlify/functions/getBooks')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        const grid = document.getElementById('bookGrid');
        grid.innerHTML = ''; // Clear the grid

        // Sort books by ID in descending order (newest first)
        data.books.sort((a, b) => b.id - a.id);

        // Add the "add book" card first
        const addBookCard = document.createElement('div');
        addBookCard.className = 'book-card add-book-card';
        addBookCard.innerHTML = `<div class="plus-icon">+</div>`;
        addBookCard.addEventListener('click', () => {
          if (typeof showSearchInterface === 'function') {
            showSearchInterface();
          }
        });
        grid.appendChild(addBookCard);

        // Display all books
        data.books.forEach(book => {
          const bookDiv = document.createElement('div');
          bookDiv.className = 'book-card';
          bookDiv.innerHTML = `
            <a href="book.html?id=${book.id}">
              <img src="${book.cover}" alt="${book.title}">
            </a>
          `;
          grid.appendChild(bookDiv);
        });
      })
      .catch(err => console.error('Error fetching data:', err));
  }

  // Load books when the page loads
  fetchAndDisplayBooks();

  // Initialize search functionality from search.js
  if (typeof initializeSearch === 'function') {
    initializeSearch();
  } else {
    console.error('Search functionality not loaded properly');
  }

  // Handle book selection
  window.selectBook = function(book) {
    // Here we can handle what happens when a book is selected from search
    console.log('Selected book:', book);
    // You can implement your logic here to add the book to your collection
  }
});