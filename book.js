document.addEventListener('DOMContentLoaded', () => {
  const bookDetailsDiv = document.getElementById('bookDetails');
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
    
    if (bookContainer && 
        !bookContainer.contains(e.target) && 
        (!modal || modal.style.display !== 'block')) {
      window.location.href = 'index.html';
    }
  });

  // Fetch book data
  fetch('/.netlify/functions/getBooks')
    .then(response => {
      if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
      return response.json();
    })
    .then(data => {
      const book = data.books.find(b => String(b.id) === String(bookId));
      if (!book) throw new Error('Book not found');
      displayBookDetails(book);
    })
    .catch(err => {
      console.error('Error fetching book:', err);
      bookDetailsDiv.innerHTML = `<p class="error">Error loading book details: ${err.message}</p>`;
    });
});

// Hjelpefunksjon for å konvertere fil til base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// Konsolidert updateBookCover funksjon
async function updateBookCover(bookId, coverBase64, fileName) {
  const password = prompt('Enter admin password:');
  if (!password) return;

  try {
    const response = await fetch('/.netlify/functions/updateBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bookId,
        coverFileBase64: coverBase64,
        coverFileName: fileName,
        secretPassword: password
      })
    });

    if (!response.ok) throw new Error('Failed to update cover');
    window.location.reload();
  } catch (error) {
    console.error('Error updating cover:', error);
    alert('Error updating cover. Please try again.');
  }
}

// Global funksjon for å velge eksisterende cover
window.selectCover = async function(coverUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  try {
    const response = await fetch('/.netlify/functions/updateBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bookId,
        updatedFields: { cover: coverUrl },
        secretPassword: prompt('Enter admin password:')
      })
    });

    if (!response.ok) throw new Error('Failed to update cover');
    window.location.reload();
  } catch (error) {
    console.error('Error updating cover:', error);
    alert('Error updating cover. Please try again.');
  }
}; 