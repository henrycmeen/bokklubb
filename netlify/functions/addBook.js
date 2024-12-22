// netlify/functions/addBook.js

const fetch = require('node-fetch'); 
// If on newer Node versions on Netlify, fetch might be built-in, 
// but "node-fetch" is guaranteed to work in most environments.

exports.handler = async function (event, context) {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed, use POST.' })
    };
  }

  // 2. Parse the incoming POST body
  //    We expect JSON with fields: title, author, coverFileBase64, coverFileName, etc.
  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }

  // Extract data from the parsed body
  const {
    title,
    author,
    description,
    readDate,
    quoteRasmus,
    quoteHenry,
    quoteAndre,
    coverFileBase64,
    coverFileName
  } = bodyData;

  // 3. Validate minimum fields
  if (!title || !author || !coverFileBase64 || !coverFileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: 'Missing required fields: title, author, coverFileBase64, coverFileName' 
      })
    };
  }

  // 4. Prepare GitHub variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
  // This is the environment variable set in Netlify.

  const owner = 'RasmusKoRiis';
  const repo = 'book';
  const branch = 'main'; // or whichever branch

  // Helpers -------------------------

  // Fetch books.json to get current list + the SHA needed to update
  async function getBooksJson() {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/books.json`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch books.json from GitHub');
    }
    const data = await res.json();

    // data.content is base64-encoded
    const decoded = Buffer.from(data.content, 'base64').toString();
    const books = JSON.parse(decoded);

    return { books, sha: data.sha };
  }

  // Update books.json with new array
  async function updateBooksJson(updatedBooks, fileSha) {
    // Convert updatedBooks to base64
    const newContent = Buffer.from(JSON.stringify(updatedBooks, null, 2)).toString('base64');

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/books.json`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add new book: ${title}`,
        content: newContent,
        sha: fileSha,       // Required: the old SHA
        branch
      })
    });

    if (!putRes.ok) {
      throw new Error('Failed to update books.json on GitHub');
    }

    return putRes.json();
  }

  // Upload cover image to assets/ (unique name using timestamp)
  async function uploadCoverImage(base64File, fileName) {
    const filePath = `assets/${Date.now()}-${fileName}`; 
    // e.g., assets/16754266342-bookCover.jpg

    const uploadRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add cover image: ${fileName}`,
        content: base64File, // the base64 string of the image
        branch
      })
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload cover image to GitHub');
    }

    const uploadData = await uploadRes.json();
    return {
      // Construct raw URL to the newly uploaded image
      coverUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${uploadData.content.path}`
    };
  }

  // Try to do everything: upload the cover & update books.json
  try {
    // 1) Upload the cover file
    const { coverUrl } = await uploadCoverImage(coverFileBase64, coverFileName);

    // 2) Get current books.json
    const { books, sha } = await getBooksJson();

    // 3) Create new book object
    const newBook = {
      title,
      author,
      description,
      readDate,
      quoteRasmus,
      quoteHenry,
      quoteAndre,
      cover: coverUrl
    };

    // 4) Append to the existing books array
    books.push(newBook);

    // 5) Update books.json (commit the new array)
    await updateBooksJson(books, sha);

    // 6) Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Book added successfully!',
        coverUrl 
      })
    };
  } catch (error) {
    // Catch any errors and report them
    console.error('Error in addBook function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};