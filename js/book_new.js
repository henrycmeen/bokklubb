// Extract book ID and user from the URL
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');
const currentUser = params.get('user') || 'rasmus';

// Function to fetch and display book data
function fetchAndDisplayBook() {
  fetch('bookclub.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      // Find the book in the books array
      const book = data.books.find(b => b.id === bookId);
      if (!book) {
        throw new Error(`Book with ID ${bookId} not found`);
      }

      // Find the user's reading entry for this book
      const user = data.users.find(u => u.id === currentUser);
      if (!user) {
        throw new Error(`User ${currentUser} not found`);
      }

      const userEntry = user.reading_list.find(entry => entry.book_id === bookId);

      // Populate book details
      document.getElementById('bookTitle').innerText = book.title;
      document.getElementById('bookAuthor').innerText = book.author;
      document.getElementById('bookDescription').innerText = book.description;
      document.getElementById('readDate').innerText = userEntry?.readDate || 'Not read';

      // Get all users' quotes for this book
      const quotes = {};
      data.users.forEach(u => {
        const entry = u.reading_list.find(e => e.book_id === bookId);
        quotes[u.id] = entry?.quote || 'No comment.';
      });

      // Populate quotes
      document.getElementById('quoteRasmus').innerText = quotes.rasmus;
      document.getElementById('quoteHenry').innerText = quotes.henry;
      document.getElementById('quoteAndre').innerText = quotes.andre;

      // Store book data for edit form
      window.currentBook = book;
      window.currentUserEntry = userEntry;
    })
    .catch(err => {
      console.error('Error fetching book data:', err);
      document.body.innerHTML = `<h1>Error: ${err.message}</h1>`;
    });
}

// Load book data when the page loads
fetchAndDisplayBook();

// Edit functionality
document.getElementById('editButton')?.addEventListener('click', () => {
  document.getElementById('editOverlay').style.display = 'block';

  // Pre-fill the form with current data
  const book = window.currentBook;
  const userEntry = window.currentUserEntry;

  if (book) {
    document.getElementById('editTitle').value = book.title || '';
    document.getElementById('editAuthor').value = book.author || '';
    document.getElementById('editDescription').value = book.description || '';
  }

  if (userEntry) {
    document.getElementById('editReadDate').value = userEntry.readDate || '';
    // Only allow editing own quote
    const quoteField = document.getElementById(`editQuote${currentUser.charAt(0).toUpperCase() + currentUser.slice(1)}`);
    if (quoteField) {
      quoteField.value = userEntry.quote || '';
    }
  }
});

document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
  document.getElementById('editOverlay').style.display = 'none';
});

document.getElementById('submitEditBtn')?.addEventListener('click', async () => {
  try {
    const updatedData = {
      book: {
        ...window.currentBook,
        title: document.getElementById('editTitle').value.trim(),
        author: document.getElementById('editAuthor').value.trim(),
        description: document.getElementById('editDescription').value.trim()
      },
      userEntry: {
        book_id: bookId,
        readDate: document.getElementById('editReadDate').value.trim(),
        quote: document.getElementById(`editQuote${currentUser.charAt(0).toUpperCase() + currentUser.slice(1)}`).value.trim()
      }
    };

    const response = await fetch('/api/updateBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) throw new Error('Failed to update book');

    // Refresh the page to show updated data
    location.reload();
  } catch (error) {
    console.error('Error updating book:', error);
    alert('Error updating book. Please try again.');
  }
});