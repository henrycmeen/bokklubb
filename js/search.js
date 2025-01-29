// Google Books API configuration
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// DOM Elements
let searchOverlay, searchContainer, bookSearch, searchResults;

// Initialize search functionality
window.initializeSearch = function() {
  searchOverlay = document.getElementById('searchOverlay');
  searchContainer = document.getElementById('searchContainer');
  bookSearch = document.getElementById('bookSearch');
  searchResults = document.getElementById('searchResults');

  if (!searchOverlay || !searchContainer || !bookSearch || !searchResults) {
    console.error('Required search elements not found');
    return;
  }

  // Hide search interface when clicking overlay
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
      hideSearchInterface();
    }
  });

  // Setup search input handler with debouncing
  let debounceTimer;
  bookSearch.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 2) {
      hideSearchResults();
      return;
    }

    showLoadingState();
    debounceTimer = setTimeout(() => searchBooks(query), 300);
  });
}

// Search books using Google Books API
async function searchBooks(query) {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=no`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    displaySearchResults(data.items || []);
  } catch (error) {
    showError('Det oppstod en feil under søket. Vennligst prøv igjen.');
  }
}

// Display search results
function displaySearchResults(books) {
  if (!searchResults) return;
  
  searchResults.style.display = 'block';

  if (books.length === 0) {
    searchResults.innerHTML = '<div class="search-result">Ingen bøker funnet</div>';
    return;
  }

  const resultsHTML = books.map(book => {
    const { title, authors, imageLinks } = book.volumeInfo;
    const coverUrl = imageLinks?.thumbnail || 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"%3e%3crect width="100" height="150" fill="%23e0e0e0"/%3e%3c/svg%3e';
    
    return `
      <div class="search-result" data-book-id="${book.id}">
        <img class="search-result-cover" src="${coverUrl}" alt="${title}">
        <div class="search-result-info">
          <div class="book-title">${title}</div>
          <div class="book-author">${authors ? authors.join(', ') : 'Ukjent forfatter'}</div>
        </div>
      </div>
    `;
  }).join('');

  searchResults.innerHTML = resultsHTML;

  // Add click handlers to results
  document.querySelectorAll('.search-result').forEach(result => {
    result.addEventListener('click', () => {
      const bookId = result.dataset.bookId;
      const selectedBook = books.find(book => book.id === bookId);
      if (selectedBook && window.selectBook) {
        const bookData = {
          title: selectedBook.volumeInfo.title,
          author: selectedBook.volumeInfo.authors?.[0] || 'Unknown',
          description: selectedBook.volumeInfo.description || '',
          releaseDate: selectedBook.volumeInfo.publishedDate?.split('-')[0] || '',
          isbn: selectedBook.volumeInfo.industryIdentifiers?.[0]?.identifier || ''
        };
        window.selectBook(bookData);
      }
      hideSearchInterface();
    });
  });
}

// UI Helper functions
function showSearchInterface() {
  if (!searchOverlay || !searchContainer || !bookSearch) return;
  searchOverlay.style.display = 'block';
  searchContainer.style.display = 'block';
  bookSearch.focus();
}

function hideSearchInterface() {
  if (!searchOverlay || !searchContainer || !bookSearch) return;
  searchOverlay.style.display = 'none';
  searchContainer.style.display = 'none';
  bookSearch.value = '';
  hideSearchResults();
}

function hideSearchResults() {
  if (!searchResults) return;
  searchResults.innerHTML = '';
  searchResults.style.display = 'none';
}

function showLoadingState() {
  if (!searchResults) return;
  searchResults.innerHTML = '<div class="search-result">Søker...</div>';
}

function showError(message) {
  if (!searchResults) return;
  searchResults.innerHTML = `<div class="search-result error">${message}</div>`;
}

// Initialize search when the page loads
document.addEventListener('DOMContentLoaded', initializeSearch);

// Export showSearchInterface for use in app.js
window.showSearchInterface = showSearchInterface;