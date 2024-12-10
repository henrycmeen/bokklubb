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