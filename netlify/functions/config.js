// netlify/functions/config.js

const config = {
  development: {
    useLocalFile: true,
    localFilePath: 'bookclub.json',
    githubConfig: {
      owner: 'henmee',
      repo: 'book-1',
      branch: 'main'
    }
  },
  production: {
    useLocalFile: false,
    githubConfig: {
      owner: 'henmee',
      repo: 'book-1',
      branch: 'main'
    }
  }
};

module.exports = {
  getConfig: () => config[process.env.NODE_ENV || 'development']
};