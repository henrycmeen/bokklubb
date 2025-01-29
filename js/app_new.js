// Get the current user from URL parameters or default to 'rasmus'
const params = new URLSearchParams(window.location.search);
const currentUser = params.get('user') || 'rasmus';

// Function to fetch and display books
function fetchAndDisplayBooks() {
  fetch('books_new.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      const grid = document.getElementById('bookGrid');
      grid.innerHTML = ''; // Clear the grid

      // Get the current user's reading list
      const user = data.users.find(u => u.id === currentUser);
      if (!user) {
        throw new Error(`User ${currentUser} not found`);
      }

      // Create a map of books for quick lookup
      const booksMap = new Map(data.books.map(book => [book.id, book]));

      // Sort the reading list by book ID in descending order
      user.reading_list.sort((a, b) => {
        const bookA = booksMap.get(a.book_id);
        const bookB = booksMap.get(b.book_id);
        return bookB?.id.localeCompare(bookA?.id) || 0;
      });

      // Display books from the user's reading list
      user.reading_list.forEach(entry => {
        const book = booksMap.get(entry.book_id);
        if (book) {
          const bookDiv = document.createElement('div');
          bookDiv.innerHTML = `
            <a href="book.html?id=${book.id}&user=${currentUser}">
              <img src="${book.cover}" alt="${book.title}">
            </a>
          `;
          grid.appendChild(bookDiv);
        }
      });
    })
    .catch(err => console.error('Error fetching data:', err));
}

// Load books when the page loads
fetchAndDisplayBooks();

// Show/Hide Add Book Form Container
const showAddBookFormBtn = document.getElementById('showAddBookFormBtn');
const addBookFormContainer = document.getElementById('addBookFormContainer');
const cancelAddBookBtn = document.getElementById('cancelAddBookBtn');
const addBookBtn = document.getElementById('addBookBtn');
const formMessage = document.getElementById('formMessage');

// Show form
showAddBookFormBtn.addEventListener('click', () => {
  addBookFormContainer.style.display = 'flex';
  document.getElementById('bookTitle').focus();
});

// Hide form
function hideForm() {
  addBookFormContainer.style.display = 'none';
  document.getElementById('addBookForm').reset();
  if (formMessage) formMessage.textContent = '';
}

cancelAddBookBtn.addEventListener('click', hideForm);

// Hide form when clicking outside
addBookFormContainer.addEventListener('click', (e) => {
  if (e.target === addBookFormContainer) hideForm();
});

// Hide form with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && addBookFormContainer.style.display === 'flex') hideForm();
});

// Handle form submission
addBookBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (formMessage) formMessage.textContent = '';

  // Gather form data
  const formData = {
    title: document.getElementById('bookTitle').value.trim(),
    author: document.getElementById('bookAuthor').value.trim(),
    releaseDate: document.getElementById('releaseDate').value.trim(),
    author_birthyear: document.getElementById('authorBirthyear').value.trim(),
    genre: document.getElementById('genre').value.trim(),
    realism_value: document.getElementById('realismValue').value.trim(),
    length: document.getElementById('length').value.trim(),
    country: document.getElementById('country').value.trim(),
    latitude: document.getElementById('latitude').value.trim(),
    longitude: document.getElementById('longitude').value.trim(),
    description: document.getElementById('description').value.trim()
  };

  // Validate form data
  if (!formData.title || !formData.author) {
    if (formMessage) formMessage.textContent = 'Please fill in all required fields';
    return;
  }

  try {
    const response = await fetch('/api/addBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to add book');

    hideForm();
    fetchAndDisplayBooks(); // Refresh the book grid
  } catch (error) {
    console.error('Error adding book:', error);
    if (formMessage) formMessage.textContent = 'Error adding book. Please try again.';
  }
});