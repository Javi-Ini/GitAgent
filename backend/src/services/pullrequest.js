const { Octokit } = require('@octokit/rest');

// Creates a GitHub API client authenticated with our token
const getOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

// Main function — creates a branch and opens a pull request with the suggested fix
const createFixPR = async (owner, repo, issue) => {
  const octokit = getOctokit();

  // Step 1: Get the latest commit SHA from the main branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });
  const latestSHA = ref.object.sha;

  // Step 2: Create a new branch for this fix
  const branchName = `gitagent-fix-${Date.now()}`;
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: latestSHA,
  });

  // Step 3: Get the current file content so we can update it
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: issue.file,
  });

  // Step 4: Create a commit with the suggested fix as a comment in the file
  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
  const fixComment = `\n// GITAGENT FIX SUGGESTION:\n// Issue: ${issue.description}\n// Fix: ${issue.suggestion}\n`;
  const updatedContent = fixComment + currentContent;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: issue.file,
    message: `fix: ${issue.description}`,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });

  // Step 5: Open a pull request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `[GitAgent] Fix: ${issue.description}`,
    body: `## GitAgent Automated Fix\n\n**Issue Type:** ${issue.type}\n**Severity:** ${issue.severity}\n**File:** ${issue.file}\n\n**Problem:**\n${issue.description}\n\n**Suggested Fix:**\n${issue.suggestion}`,
    head: branchName,
    base: 'main',
  });

  return { prUrl: pr.html_url, branchName };
};

module.exports = { createFixPR };