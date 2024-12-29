// netlify/functions/updateBook.js

const fetch = require('node-fetch');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed, use POST.' })
    };
  }

  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }

  const {
    id,
    source,
    updatedFields,
    secretPassword
  } = bodyData;

  // Ensure we have required data
  if (!id || !source || !updatedFields) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required fields: id, source, updatedFields.' })
    };
  }

  // Compare password
  if (secretPassword !== process.env.ADMIN_PASSWORD) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        success: false,
        message: 'Unauthorized: incorrect password'
      })
    };
  }

  // GitHub details
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const owner = 'RasmusKoRiis';
  const repo = 'book';
  const branch = 'main';

  async function getJson(fileName) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${fileName} (status ${res.status})`);
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString();
    const json = JSON.parse(content);
    return { json, sha: data.sha };
  }

  async function updateJson(fileName, updatedData, sha) {
    const newContent = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update book with ID ${id}`,
        content: newContent,
        sha,
        branch
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to update ${fileName} (status ${res.status}): ${errText}`);
    }
    return res.json();
  }

  try {
    // 1) fetch the existing JSON
    const fileName = source || 'books.json';
    const { json: booksArray, sha } = await getJson(fileName);

    // 2) find the book by ID
    const bookIndex = booksArray.findIndex(b => String(b.id) === String(id));
    if (bookIndex < 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Book not found' })
      };
    }

    // 3) update fields
    const bookToUpdate = booksArray[bookIndex];

    // If your "updatedFields" might include quotes, handle them separately:
    if (!bookToUpdate.quotes) {
      bookToUpdate.quotes = { rasmus: "", henry: "", andre: "" };
    }
    
    // For each updated field:
    for (const [key, value] of Object.entries(updatedFields)) {
      // If the key starts with 'quoteRasmus', 'quoteHenry', etc., 
      // set them inside the `quotes` object.
      if (key === 'quoteRasmus') {
        bookToUpdate.quotes.rasmus = value;
      } else if (key === 'quoteHenry') {
        bookToUpdate.quotes.henry = value;
      } else if (key === 'quoteAndre') {
        bookToUpdate.quotes.andre = value;
      } else {
        // Otherwise, update the book top-level field
        bookToUpdate[key] = value;
      }
    }

    // 4) commit updated array
    await updateJson(fileName, booksArray, sha);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Book updated successfully!' })
    };
  } catch (err) {
    console.error('Error updating book:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};
