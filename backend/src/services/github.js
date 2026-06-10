const { Octokit } = require('@octokit/rest');

// Creates a GitHub API client authenticated with our token from .env
const getOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

// Takes a GitHub URL and extracts the owner and repo name
// e.g. github.com/javi/GitAgent → { owner: 'javi', repo: 'GitAgent' }
const parseRepoUrl = (url) => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2].replace('.git', '') };
};

// Fetches the list of files/folders at a given path in the repo
const fetchRepoContents = async (owner, repo, path = '') => {
  const octokit = getOctokit();
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  return data;
};

// Fetches the actual code inside a file
// GitHub sends file content as base64, so we decode it to readable text
const fetchFileContent = async (owner, repo, path) => {
  const octokit = getOctokit();
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data.content;
};

// Recursively walks through the entire repo and collects all code files
const fetchAllFiles = async (owner, repo, path = '', files = []) => {
  const contents = await fetchRepoContents(owner, repo, path);
  for (const item of contents) {
    if (item.type === 'file' && isCodeFile(item.name)) {
      // If it's a code file, fetch its content and add it to our list
      const content = await fetchFileContent(owner, repo, item.path);
      files.push({ path: item.path, content });
    } else if (item.type === 'dir') {
      // If it's a folder, dive into it recursively
      await fetchAllFiles(owner, repo, item.path, files);
    }
  }
  return files;
};

// Filters out non-code files like images, markdown, config files etc.
const isCodeFile = (filename) => {
  const extensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rb', '.php', '.cs'];
  return extensions.some(ext => filename.endsWith(ext));
};

// Export the functions we need in other files
module.exports = { parseRepoUrl, fetchAllFiles };