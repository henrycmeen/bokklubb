// netlify/functions/config.js

const config = {
  development: {
    useLocalFile: true,
    localFilePath: 'bookclub.json',
    githubConfig: {
      owner: 'henmee',
      repo: 'bokklubb',
      branch: 'main'
    }
  },
  production: {
    useLocalFile: false,
    githubConfig: {
      owner: 'henmee',
      repo: 'bokklubb',
      branch: 'main'
    }
  }
};

export const getConfig = () => config[process.env.NODE_ENV || 'development'];