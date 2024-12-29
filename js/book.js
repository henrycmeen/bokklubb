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

          // Store the book object in a global variable for later use
          window.currentBook = book;
          // Also store which file we found it in, if needed
          window.currentSourceFile = files[index];

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

document.getElementById('editButton').addEventListener('click', () => {
  // Show the edit overlay
  document.getElementById('editOverlay').style.display = 'block';

  // Pre-fill the form fields with current data
  document.getElementById('editTitle').value = window.currentBook.title || '';
  document.getElementById('editAuthor').value = window.currentBook.author || '';
  document.getElementById('editDescription').value = window.currentBook.description || '';
  document.getElementById('editQuoteRasmus').value = window.currentBook.quoteRasmus || '';

  // ... etc for any fields you'd like to allow editing
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
  document.getElementById('editOverlay').style.display = 'none';
});

document.getElementById('submitEditBtn').addEventListener('click', async () => {
  // Prompt the user for the admin password
  const userPassword = prompt('Please enter the admin password:');
  if (!userPassword) {
    alert('You must enter a password to continue.');
    return; // Stop if user pressed "Cancel" or didn’t type anything
  }

  // Gather updated data from the form
  const updatedTitle = document.getElementById('editTitle').value.trim();
  const updatedAuthor = document.getElementById('editAuthor').value.trim();
  const updatedDescription = document.getElementById('editDescription').value.trim();
  const updatedQuoteRasmus = document.getElementById('editQuoteRasmus').value.trim();

  // Build payload
  const payload = {
    // We definitely need to identify which entry to update
    id: window.currentBook.id, 
    source: window.currentSourceFile, 
    updatedFields: {
      title: updatedTitle,
      author: updatedAuthor,
      description: updatedDescription,
      quoteRasmus: updatedQuoteRasmus,
      // ... any other fields ...
    },
    // Use whatever the user typed in the prompt
    secretPassword: userPassword
  };

  try {
    const res = await fetch('/.netlify/functions/updateBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server responded with status ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    if (result.success) {
      alert('Book updated successfully!');
      // Hide overlay, maybe refresh or re-fetch data
      document.getElementById('editOverlay').style.display = 'none';

      // Optional: Update the DOM if you want immediate changes
      document.getElementById('bookTitle').innerText = updatedTitle;
      document.getElementById('bookAuthor').innerText = updatedAuthor;
      document.getElementById('bookDescription').innerText = updatedDescription;
      document.getElementById('quoteRasmus').innerText = updatedQuoteRasmus;
      
    } else {
      alert('Failed to update book: ' + result.message);
    }
  } catch (error) {
    alert('Error updating book: ' + error.message);
  }
});
