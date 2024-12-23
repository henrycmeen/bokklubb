// Get the current JSON source from URL parameters or default to books.json
const params = new URLSearchParams(window.location.search);
const source = params.get('source') || 'books.json';

// Dynamically update the "*" chart button's href based on the current source
const chartButton = document.querySelector('.chart-button');
if (chartButton) {
  chartButton.href = `chart.html?source=${source}`;
}

// Function to fetch and display books from a given JSON file
function fetchAndDisplayBooks(jsonFile) {
  fetch(jsonFile)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      const grid = document.getElementById('bookGrid');
      grid.innerHTML = ''; // Clear the grid

      // Sort the books by ID in descending order (assuming each book has a unique 'id')
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

// **Show/Hide Add Book Form Container**
const showAddBookFormBtn = document.getElementById('showAddBookFormBtn');
const addBookFormContainer = document.getElementById('addBookFormContainer');
const cancelAddBookBtn = document.getElementById('cancelAddBookBtn');
const addBookBtn = document.getElementById('addBookBtn');
const formMessage = document.getElementById('formMessage'); // Optional for user feedback

// Function to show the Add Book form container
showAddBookFormBtn.addEventListener('click', () => {
  addBookFormContainer.style.display = 'flex';
  document.getElementById('bookTitle').focus(); // Set focus to the first input
});

// Function to hide the Add Book form container
cancelAddBookBtn.addEventListener('click', () => {
  addBookFormContainer.style.display = 'none';
  document.getElementById('addBookForm').reset(); // Reset form fields
  if (formMessage) {
    formMessage.textContent = ''; // Clear any messages
  }
});

// Optional: Hide the form when clicking outside the form area (on the overlay)
addBookFormContainer.addEventListener('click', (e) => {
  if (e.target === addBookFormContainer) {
    addBookFormContainer.style.display = 'none';
    document.getElementById('addBookForm').reset(); // Reset form fields
    if (formMessage) {
      formMessage.textContent = ''; // Clear any messages
    }
  }
});

// Allow closing the form with the Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && addBookFormContainer.style.display === 'flex') {
    addBookFormContainer.style.display = 'none';
    document.getElementById('addBookForm').reset(); // Reset form fields
    if (formMessage) {
      formMessage.textContent = ''; // Clear any messages
    }
  }
});

// Submit Button Event Listener
addBookBtn.addEventListener('click', async (e) => {
  e.preventDefault(); // Prevent form submission

  // Clear previous messages
  if (formMessage) {
    formMessage.textContent = '';
  }

  // Gather data from the input fields
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const description = document.getElementById('bookDescription').value.trim();
  const readDate = document.getElementById('readDate').value.trim();
  const quoteRasmus = document.getElementById('quoteRasmus').value.trim();
  const quoteHenry = document.getElementById('quoteHenry').value.trim();
  const quoteAndre = document.getElementById('quoteAndre').value.trim();

  // Get the selected file from the cover <input type="file">
  const fileInput = document.getElementById('coverFile');
  if (!fileInput.files[0]) {
    alert('Please select a cover image file.');
    return;
  }
  const coverFile = fileInput.files[0];

  // Convert the file to Base64 using the helper
  let coverFileBase64;
  try {
    coverFileBase64 = await fileToBase64(coverFile);
  } catch (error) {
    console.error('Error converting file to Base64:', error);
    alert('Failed to process the cover image. Please try again.');
    return;
  }

  // Grab the password from the input field
  const adminPassword = document.getElementById('adminPassword').value.trim();

  // Basic form validation
  if (!title || !author || !coverFile) {
    alert('Please fill out all required fields and select a cover image.');
    return;
  }

  // Prepare the payload
  const payload = {
    title,
    author,
    description,
    readDate,
    quoteRasmus,
    quoteHenry,
    quoteAndre,
    coverFileBase64,
    coverFileName: coverFile.name,
    secretPassword: adminPassword // << important
  };

  // Make the POST request to your serverless function
  try {
    addBookBtn.disabled = true; // Disable the button to prevent multiple submissions

    const response = await fetch('/.netlify/functions/addBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.success) {
      alert('Book added successfully!');
      // Hide the form after successful upload
      addBookFormContainer.style.display = 'none';
      // Reset the form fields
      document.getElementById('addBookForm').reset();
      // Optionally, fetch and display the updated list of books
      fetchAndDisplayBooks(source);
    } else {
      alert('Failed to add book: ' + result.message);
      if (formMessage) {
        formMessage.textContent = 'Failed to add book: ' + result.message;
      }
    }
  } catch (error) {
    console.error('Error adding book:', error);
    alert('Error adding book: ' + error.message);
    if (formMessage) {
      formMessage.textContent = 'Error adding book: ' + error.message;
    }
  } finally {
    addBookBtn.disabled = false; // Re-enable the button
  }
});

// The file-to-Base64 helper function
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