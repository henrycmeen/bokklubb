// Extract book ID and source from the URL
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');
const source = params.get('source') || 'books.json'; // Default to books.json if source is not provided

// JSON files to search
const jsonFiles = ['books.json', 'rasmus.json', 'henry.json', 'andre.json'];

// Fetch book data from multiple JSON files
function fetchBookData(bookId, files) {
  console.log(`Looking for book ID: ${bookId}`); // Debugging

  // Helper function to recursively search through the files
  function fetchNextFile(index) {
    if (index >= files.length) {
      // No more files to search
      document.body.innerHTML = `<h1>Book with ID "${bookId}" not found</h1>`;
      return;
    }

    console.log(`Fetching from ${files[index]}`); // Debugging

    fetch(files[index])
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${files[index]}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`Data fetched from ${files[index]}:`, data); // Debugging

        // Find the book with the matching ID
        const book = data.find(item => String(item.id) === String(bookId));

        if (book) {
          console.log(`Book found:`, book); // Debugging

          // Populate book details
          document.getElementById('bookTitle').innerText = book.title || "No title available";
          document.getElementById('bookAuthor').innerText = book.author || "Unknown author";
          document.getElementById('bookDescription').innerText = book.description || "No description available";
          document.getElementById('readDate').innerText = book.readDate || "No read date";

          // Populate quotes
          const quotes = book.quotes || {};
          document.getElementById('quoteRasmus').innerText = quotes.rasmus || "No comment.";
          document.getElementById('quoteHenry').innerText = quotes.henry || "No comment.";
          document.getElementById('quoteAndre').innerText = quotes.andre || "No comment.";
        } else {
          console.log(`Book not found in ${files[index]}`); // Debugging
          fetchNextFile(index + 1); // Search the next file
        }
      })
      .catch(err => {
        console.error(`Error fetching data from ${files[index]}:`, err);
        fetchNextFile(index + 1); // Move to the next file on error
      });
  }

  // Start with the first file
  fetchNextFile(0);
}

// Initiate fetching with the book ID
fetchBookData(bookId, jsonFiles);