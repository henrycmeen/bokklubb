document.addEventListener('DOMContentLoaded', () => {
  const bookDetailsDiv = document.getElementById('bookDetails');
  // Get book ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  if (!bookId) {
    console.error('No book ID provided');
    bookDetailsDiv.innerHTML = '<p class="error">Error: No book ID provided</p>';
    return;
  }

  // Add click event listener to handle clicks outside the book container
  document.addEventListener('click', (e) => {
    const bookContainer = document.querySelector('.book-container');
    const modal = document.getElementById('coverModal');
    
    // Check if click is outside book container and modal is not visible
    if (bookContainer && 
        !bookContainer.contains(e.target) && 
        (!modal || modal.style.display !== 'block')) {
      window.location.href = 'index.html';
    }
  });

  // Fetch book data
  fetch('/.netlify/functions/getBooks')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      const book = data.books.find(b => String(b.id) === String(bookId));
      if (!book) {
        throw new Error('Book not found');
      }
      displayBookDetails(book);
    })
    .catch(err => {
      console.error('Error fetching book:', err);
      bookDetailsDiv.innerHTML = `<p class="error">Error loading book details: ${err.message}</p>`;
      return;
    });
});

function displayBookDetails(book) {
  const bookDetailsDiv = document.getElementById('bookDetails');
  
  // Create HTML structure for book details
  const html = `
    <div class="book-container">
      <div class="book-cover">
        <img src="${book.cover || 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"%3e%3crect width="100" height="150" fill="%23e0e0e0"/%3e%3c/svg%3e'}" alt="${book.title} cover" class="cover-image">
        <button class="change-cover-btn">Change Cover</button>
      </div>
      <div class="book-info">
        <h1>${book.title}</h1>
        <h2>${book.author}</h2>
        <p class="release-date">Published: ${book.releaseDate || 'Unknown'}</p>
        <p class="genre">Genre: ${book.genre || 'Unknown'}</p>
        <p class="length">${book.length ? book.length + ' pages' : ''}</p>
        <p class="country">Country: ${book.country || 'Unknown'}</p>
        <div class="description">
          <h3>Description</h3>
          <p>${book.description || 'No description available.'}</p>
        </div>
        ${book.quotes ? `
        <div class="quotes">
          <h3>Quotes</h3>
          ${book.quotes.rasmus ? `<div class="quote"><strong>Rasmus:</strong> "${book.quotes.rasmus}"</div>` : ''}
          ${book.quotes.henry ? `<div class="quote"><strong>Henry:</strong> "${book.quotes.henry}"</div>` : ''}
          ${book.quotes.andre ? `<div class="quote"><strong>Andre:</strong> "${book.quotes.andre}"</div>` : ''}
        </div>
        ` : ''}
      </div>
    </div>

    <div id="coverModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="cover-options">
          <div id="coverGrid"></div>
          <div class="upload-cover-btn">
            <label for="coverUpload" class="upload-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </label>
            <input type="file" id="coverUpload" accept="image/*" style="display: none;">
          </div>
        </div>
      </div>
    </div>
  `;

  bookDetailsDiv.innerHTML = html;

  // Add event listeners for cover change functionality
  setupCoverChangeModal(book);
}

function setupCoverChangeModal(book) {
  const modal = document.getElementById('coverModal');
  const closeBtn = document.querySelector('.close');
  const changeBtn = document.querySelector('.change-cover-btn');
  const coverGrid = document.getElementById('coverGrid');
  const fileInput = document.getElementById('coverUpload');

  // Event listeners
  changeBtn.addEventListener('click', () => modal.style.display = 'block');
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Fetch and populate cover grid from coverAssets.json
  fetch('/js/coverAssets.json')
    .then(response => response.json())
    .then(data => {
      coverGrid.innerHTML = data.covers
        .map(filename => {
          const randomRotation = Math.random() * 12 - 6; // Random rotation between -6 and 6 degrees
          const randomScale = 0.9 + Math.random() * 0.2; // Random scale between 0.9 and 1.1
          return `
            <div class="cover-option" style="--random-rotation: ${randomRotation}deg; --random-scale: ${randomScale}">
              <img src="assets/${filename}" alt="${filename}" data-filename="${filename}">
            </div>
          `;
        })
        .join('');
    })
    .catch(error => {
      console.error('Error loading cover assets:', error);
      coverGrid.innerHTML = '<p class="error">Error loading cover options</p>';
    });

  // Handle cover selection
  coverGrid.addEventListener('click', async (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    const filename = img.dataset.filename;
    const response = await fetch(img.src);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1];
      updateBookCover(book.id, base64data, filename);
    };

    reader.readAsDataURL(blob);
  });

  // Handle file upload
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1];
      updateBookCover(book.id, base64data, file.name);
    };
    reader.readAsDataURL(file);
  });
}

async function updateBookCover(bookId, coverBase64, filename) {
  const modal = document.getElementById('coverModal');
  const password = prompt('Please enter admin password:');
  if (!password) return;

  try {
    const response = await fetch('/.netlify/functions/addBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secretPassword: password,
        title: filename,
        coverFileBase64: coverBase64,
        coverFileName: filename
      })
    });

    const result = await response.json();
    if (result.success) {
      modal.style.display = 'none';
      location.reload();
    } else {
      alert('Failed to update cover: ' + result.message);
    }
  } catch (error) {
    console.error('Error updating cover:', error);
    alert('Failed to update cover. Please try again.');
  }
}

async function loadExistingCovers(coverGrid) {
  try {
    const response = await fetch('/.netlify/functions/getBooks');
    if (!response.ok) throw new Error('Failed to fetch books');
    const data = await response.json();

    // Get unique covers
    const covers = [...new Set(data.books.map(book => book.cover))];

    // Create grid of covers
    coverGrid.innerHTML = covers
      .map(cover => `
        <div class="cover-option">
          <img src="${cover}" alt="Book cover option" onclick="selectCover('${cover}')">
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Error loading covers:', error);
    coverGrid.innerHTML = '<p class="error">Error loading covers</p>';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

async function updateBookCover(bookId, coverBase64, fileName) {
  try {
    const response = await fetch('/.netlify/functions/updateBook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: bookId,
        coverFileBase64: coverBase64,
        coverFileName: fileName,
        secretPassword: prompt('Enter admin password:')
      })
    });

    if (!response.ok) throw new Error('Failed to update cover');

    // Refresh the page to show new cover
    window.location.reload();
  } catch (error) {
    console.error('Error updating cover:', error);
    alert('Error updating cover. Please try again.');
  }
}

// Global function for selecting existing cover
window.selectCover = async function(coverUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  try {
    const response = await fetch('/.netlify/functions/updateBook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: bookId,
        updatedFields: { cover: coverUrl },
        secretPassword: prompt('Enter admin password:')
      })
    });

    if (!response.ok) throw new Error('Failed to update cover');

    // Refresh the page to show new cover
    window.location.reload();
  } catch (error) {
    console.error('Error updating cover:', error);
    alert('Error updating cover. Please try again.');
  }
};