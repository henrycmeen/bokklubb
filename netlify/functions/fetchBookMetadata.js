const fetch = require('node-fetch');

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

async function fetchBookMetadata(title) {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(title)}`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('No books found');
    }

    // Return multiple books instead of just the first one
    return data.items.slice(0, 5).map(item => {
      const book = item.volumeInfo;
      return {
        title: book.title,
        author: book.authors ? book.authors[0] : 'Unknown',
        releaseDate: book.publishedDate ? parseInt(book.publishedDate.split('-')[0]) : null,
        genre: book.categories ? book.categories[0] : 'Fiction',
        length: book.pageCount || null,
        description: book.description || '',
        country: book.language === 'en' ? 'Unknown' : book.language.toUpperCase(),
        cover: book.imageLinks ? book.imageLinks.thumbnail : null,
        latitude: null,
        longitude: null,
        realism_value: 5
      };
    });
  } catch (error) {
    console.error('Error fetching book metadata:', error);
    throw error;
  }
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const { title } = JSON.parse(event.body);
    
    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Title is required' })
      };
    }

    const metadata = await fetchBookMetadata(title);
    
    return {
      statusCode: 200,
      body: JSON.stringify(metadata)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};