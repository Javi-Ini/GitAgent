const express = require('express');
const router = express.Router();
const { parseRepoUrl } = require('../services/github');
const { createFixPR } = require('../services/pullrequest');

// POST /api/pr/create
// Receives a repo URL and an issue, creates a branch and opens a PR
router.post('/create', async (req, res) => {
  const { repoUrl, issue } = req.body;

  if (!repoUrl || !issue) {
    return res.status(400).json({ error: 'repoUrl and issue are required' });
  }

  try {
    // Extract owner and repo from the URL
    const { owner, repo } = parseRepoUrl(repoUrl);

    // Create the fix branch and open a PR
    console.log(`Creating PR for ${owner}/${repo} - ${issue.description}`);
    const result = await createFixPR(owner, repo, issue);

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('PR creation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;