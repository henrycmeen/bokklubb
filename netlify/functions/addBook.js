// netlify/functions/addBook.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log("=== addBook function invoked ===");

  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.error("Method not allowed: Received", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed, use POST.' })
    };
  }

  // 2. Parse the incoming POST body
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

  // *** Extract the submitted password plus other fields ***
  const {
    secretPassword,
    title,
    author,
    realeaseDate,
    author_birthyear,
    genre,
    realism_value,
    lenght,
    country,
    latitude,
    longitude,
    description,
    readDate,
    quoteRasmus,
    quoteHenry,
    quoteAndre,
    coverFileBase64,
    coverFileName,
    source
  } = bodyData;

  // *** Compare secretPassword to our server-side env var ***
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

  // 3. Validate minimum fields
  if (!title || !author || !coverFileBase64 || !coverFileName) {
    console.error("Missing required fields:", {
      title,
      author,
      coverFileBase64: Boolean(coverFileBase64),
      coverFileName
    });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing required fields: title, author, coverFileBase64, coverFileName'
      })
    };
  }

  // 4. Prepare GitHub variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const owner = 'RasmusKoRiis';
  const repo = 'book';
  const branch = 'main';

  console.log("GITHUB_TOKEN present?", !!GITHUB_TOKEN);
  console.log("owner:", owner, "repo:", repo, "branch:", branch);

  // ================================
  //  Define fileName in main scope
  // ================================
  const fileName = source || 'books.json';  // <-- THIS LINE

  //  Helpers -------------------------

  /**
   * 1) Fetch existing JSON from GitHub
   */
  async function getBooksJson(fileNameParam) {  // <-- accept fileNameParam
    console.log(`Fetching file "${fileNameParam}" from GitHub...`);

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fileNameParam}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      }
    );

    console.log(`${fileNameParam} fetch status:`, res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error(`Failed to fetch ${fileNameParam}. Response text:`, text);
      throw new Error(
        `Failed to fetch ${fileNameParam} from GitHub (status ${res.status})`
      );
    }

    const data = await res.json();
    console.log(`${fileNameParam} fetch success:`, data);

    const decoded = Buffer.from(data.content, 'base64').toString();
    const books = JSON.parse(decoded);
    console.log("Parsed existing books:", books);

    return { books, sha: data.sha };
  }

  /**
   * 2) Update (commit) the JSON file on GitHub
   */
  async function updateBooksJson(updatedBooks, fileSha, fileNameParam) {
    console.log(`Updating file "${fileNameParam}" with new books array...`);
    const newContent = Buffer.from(
      JSON.stringify(updatedBooks, null, 2)
    ).toString('base64');

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fileNameParam}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add new book: ${title}`,
          content: newContent,
          sha: fileSha,
          branch
        })
      }
    );
    console.log(`PUT /${fileNameParam} status:`, putRes.status);

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error(`Failed to update ${fileNameParam}:`, errText);
      throw new Error(
        `Failed to update ${fileNameParam} (status ${putRes.status}): ${errText}`
      );
    }

    const json = await putRes.json();
    console.log("Update success:", json);
    return json;
  }

  /**
   * 3) Upload the cover image
   */
  async function uploadCoverImage(base64File, fileName) {
    console.log(`Uploading cover image: ${fileName} ...`);
    const filePath = `assets/${Date.now()}-${fileName}`;

    const uploadRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add cover image: ${fileName}`,
          content: base64File,
          branch
        })
      }
    );
    console.log("PUT /assets/ status:", uploadRes.status);

    if (!uploadRes.ok) {
      const uploadErrText = await uploadRes.text();
      console.error("Failed to upload cover image:", uploadErrText);
      throw new Error(
        `Failed to upload cover image to GitHub (status ${uploadRes.status})`
      );
    }

    const uploadData = await uploadRes.json();
    console.log("Cover image upload success:", uploadData);

    return {
      coverUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${uploadData.content.path}`
    };
  }

  // Main logic inside try/catch
  try {
    console.log("1) Uploading the cover file...");
    const { coverUrl } = await uploadCoverImage(coverFileBase64, coverFileName);

    console.log("2) Fetching current source file:", fileName);
    // pass fileName to getBooksJson
    const { books, sha } = await getBooksJson(fileName);

    console.log("3) Create new book object");
    const newBookId = Date.now();

    const newBook = {
      id: newBookId,
      title,
      author,
      realeaseDate,
      author_birthyear,
      genre,
      realism_value,
      lenght,
      country,
      latitude,
      longitude,
      description,
      readDate,
      quoteRasmus,
      quoteHenry,
      quoteAndre,
      cover: coverUrl
    };
    console.log("New book:", newBook);

    console.log("4) Append to existing books...");
    books.push(newBook);

    console.log("5) Update that source file (commit)...");
    // pass fileName again
    await updateBooksJson(books, sha, fileName);

    console.log("6) Return success. Done!");
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Book added successfully!",
        coverUrl
      })
    };
  } catch (error) {
    console.error("Error in addBook function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};
