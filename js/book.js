// Extract book ID from the URL
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');

// Fetch book data and populate the page
fetch('books.json')
  .then(response => response.json())
  .then(data => {
    const book = data.find(item => item.id == bookId);
    if (book) {
      // Populate book details
      document.getElementById('bookTitle').innerText = book.title;
      document.getElementById('bookAuthor').innerText = book.author;
      document.getElementById('bookDescription').innerText = book.description;
      document.getElementById('readDate').innerText = `${book.readDate}`;
      
      // Populate quotes
      document.getElementById('quoteRasmus').innerText = book.quotes.rasmus || "No comment.";
      document.getElementById('quoteHenry').innerText = book.quotes.henry || "No comment.";
      document.getElementById('quoteAndre').innerText = book.quotes.andre || "No comment.";
    } else {
      document.body.innerHTML = '<h1>Book not found</h1>';
    }
  })
  .catch(err => console.error('Error fetching book data:', err));