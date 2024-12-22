// Get the current JSON source from URL parameters or default to books.json
const params = new URLSearchParams(window.location.search);
const source = params.get('source') || 'books.json';

// Dynamically update the "+" button's href based on the current source
const chartButton = document.querySelector('.chart-button');
chartButton.href = `chart.html?source=${source}`;

// Function to fetch and display books from a given JSON file
function fetchAndDisplayBooks(jsonFile) {
  fetch(jsonFile)
    .then(response => response.json())
    .then(data => {
      const grid = document.getElementById('bookGrid');
      grid.innerHTML = ''; // Clear the grid

      // Sort the books by ID in descending order
      data.sort((a, b) => b.id - a.id);

      // Populate the grid with sorted books
      data.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.innerHTML = `
          <a href="book.html?id=${book.id}&source=${jsonFile}">
            <img src="${book.cover}" alt="${book.title}">
          </a>
        `;
        grid.appendChild(bookDiv);
      });
    })
    .catch(err => console.error(`Error fetching data from ${jsonFile}:`, err));
}
// Load books from the correct source
fetchAndDisplayBooks(source);

const showAddBookFormBtn = document.getElementById('showAddBookFormBtn');
const addBookForm = document.getElementById('addBookForm');
const cancelAddBookBtn = document.getElementById('cancelAddBookBtn');

showAddBookFormBtn.addEventListener('click', () => {
  addBookForm.style.display = 'block';
});

cancelAddBookBtn.addEventListener('click', () => {
  addBookForm.style.display = 'none';
});

// 1) Get the reference to the "Submit" button
const addBookBtn = document.getElementById('addBookBtn');

// 2) Attach a click event listener
addBookBtn.addEventListener('click', async (e) => {
  e.preventDefault(); // Stop form from reloading the page

  // Gather data from the input fields
  const title = document.getElementById('bookTitle').value;
  const author = document.getElementById('bookAuthor').value;
  const description = document.getElementById('bookDescription').value;
  const readDate = document.getElementById('readDate').value;
  const quoteRasmus = document.getElementById('quoteRasmus').value;
  const quoteHenry = document.getElementById('quoteHenry').value;
  const quoteAndre = document.getElementById('quoteAndre').value;

  // Get the selected file from the cover <input type="file">
  const fileInput = document.getElementById('coverFile');
  if (!fileInput.files[0]) {
    alert('Please select a cover image file.');
    return;
  }
  const coverFile = fileInput.files[0];

  // Convert the file to Base64 using our helper
  const coverFileBase64 = await fileToBase64(coverFile);

  // Construct the payload to send to the Netlify Function
  const payload = {
    title,
    author,
    description,
    readDate,
    quoteRasmus,
    quoteHenry,
    quoteAndre,
    coverFileBase64,             // Base64 content
    coverFileName: coverFile.name // e.g. "mycover.jpg"
  };

  // Make the POST request to your serverless function
  try {
    const response = await fetch('/.netlify/functions/addBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      alert('Book added successfully!');
      // Hide the form after successful upload
      addBookForm.style.display = 'none';
      // Optionally refresh or fetch updated data to show the new book
    } else {
      alert('Failed to add book: ' + result.message);
    }
  } catch (error) {
    console.error('Error adding book:', error);
    alert('Error adding book: ' + error.message);
  }
});

// 3) The file-to-Base64 helper function
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // 'data:image/png;base64,iVBOR...' -> we want only the base64 portion
      const base64Data = reader.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Add event listeners for the sidebar buttons
document.getElementById('rasmusButton').addEventListener('click', () => {
  window.location.href = `index.html?source=rasmus.json`;
});

document.getElementById('henryButton').addEventListener('click', () => {
  window.location.href = `index.html?source=henry.json`;
});

document.getElementById('andreButton').addEventListener('click', () => {
  window.location.href = `index.html?source=andre.json`;
});

document.getElementById('backButton').addEventListener('click', () => {
  window.location.href = `index.html?source=books.json`;
});

