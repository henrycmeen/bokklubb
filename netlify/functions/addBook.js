// netlify/functions/addBook.js

const fetch = require('node-fetch');
const { getConfig } = require('./config');

exports.handler = async function (event, context) {
  console.log("=== addBook function invoked ===");

  if (event.httpMethod !== 'POST') {
    console.error("Method not allowed: Received", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed, use POST.' })
    };
  }

  let bodyData;
  try {
    console.log("Parsing request body...");
    bodyData = JSON.parse(event.body);
    console.log("Parsed body:", bodyData);
  } catch (err) {
    console.error("JSON parse error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }

  const { secretPassword, title, coverFileBase64, coverFileName } = bodyData;

  if (secretPassword !== process.env.ADMIN_PASSWORD) {
    console.error("Unauthorized: incorrect password");
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: 'Unauthorized: incorrect password'
      })
    };
  }

  if (!title || !coverFileBase64 || !coverFileName) {
    console.error("Missing required fields");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing required fields: title, coverFileBase64, coverFileName'
      })
    };
  }

  try {
    // Fetch book metadata
    const metadataResponse = await fetch(`${event.url.replace('/addBook', '/fetchBookMetadata')}`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch book metadata');
    }

    const metadata = await metadataResponse.json();
    
    // Get environment configuration
    const config = getConfig();
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const { owner, repo, branch } = config.githubConfig;

    console.log("GITHUB_TOKEN present?", !!GITHUB_TOKEN);
    console.log("owner:", owner, "repo:", repo, "branch:", branch);

    const fileName = 'bookclub.json';

    // Upload cover image
    console.log("1) Uploading the cover file...");
    const filePath = `assets/${Date.now()}-${coverFileName}`;
    const uploadRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add cover image: ${coverFileName}`,
          content: coverFileBase64,
          branch
        })
      }
    );

    if (!uploadRes.ok) {
      const uploadErrText = await uploadRes.text();
      throw new Error(`Failed to upload cover image to GitHub (status ${uploadRes.status})`);
    }

    const uploadData = await uploadRes.json();
    const coverUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${uploadData.content.path}`;

    // Fetch existing books
    console.log("2) Fetching current source file:", fileName);
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch ${fileName} from GitHub (status ${res.status})`);
    }

    const data = await res.json();
    const books = JSON.parse(Buffer.from(data.content, 'base64').toString());

    // Create new book object
    console.log("3) Create new book object");
    const newBook = {
      id: Date.now(),
      title: metadata.title,
      author: metadata.author,
      releaseDate: metadata.releaseDate,
      genre: metadata.genre,
      length: metadata.length,
      description: metadata.description,
      country: metadata.country,
      cover: coverUrl
    };

    // Update books array
    console.log("4) Append to existing books...");
    books.push(newBook);

    // Commit updated file
    console.log("5) Update that source file (commit)...");
    const newContent = Buffer.from(JSON.stringify(books, null, 2)).toString('base64');
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add new book: ${title}`,
          content: newContent,
          sha: data.sha,
          branch
        })
      }
    );

    if (!putRes.ok) {
      throw new Error(`Failed to update ${fileName} (status ${putRes.status})`);
    }

    console.log("6) Return success. Done!");
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Book added successfully',
        data: newBook
      })
    };
  } catch (error) {
    console.error('Error processing book:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
