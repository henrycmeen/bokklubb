const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed, use GET.' })
    };
  }

  try {
    const config = getConfig();
    let booksData;

    if (config.useLocalFile) {
      // In development, read from local file
      const filePath = path.join(process.cwd(), config.localFilePath);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      booksData = JSON.parse(fileContent);
    } else {
      // In production, fetch from GitHub
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const { owner, repo, branch } = config.githubConfig;

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/bookclub.json`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch bookclub.json (status ${res.status})`);
      }
      const data = await res.json();
      const content = Buffer.from(data.content, 'base64').toString();
      booksData = JSON.parse(content);
    }

    // Ensure we're returning the full data structure with both books and users
    return {
      statusCode: 200,
      body: JSON.stringify(booksData)
    };
  } catch (err) {
    console.error('Error fetching books:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};