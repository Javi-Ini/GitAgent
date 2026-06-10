const express = require('express');
const router = express.Router();
const { parseRepoUrl, fetchAllFiles } = require('../services/github');
const { analyzeCode } = require('../services/analyzer');

// POST /api/analyze
// Receives a GitHub repo URL, fetches the code, and returns analysis results
router.post('/', async (req, res) => {
  const { repoUrl } = req.body;

  // Make sure a URL was actually provided
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    // Step 1: Extract owner and repo name from the URL
    const { owner, repo } = parseRepoUrl(repoUrl);

    // Step 2: Fetch all code files from the repository
    console.log(`Fetching files from ${owner}/${repo}...`);
    const files = await fetchAllFiles(owner, repo);

    // Step 3: Send the code through Gemini for analysis
    console.log(`Analyzing ${files.length} files...`);
    const analysis = await analyzeCode(files);

    // Step 4: Return the results to the frontend
    res.json({ success: true, repo: `${owner}/${repo}`, ...analysis });

  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;