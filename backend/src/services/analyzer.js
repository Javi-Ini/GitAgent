require('dotenv').config();
const Groq = require('groq-sdk');

// Initialize Groq client with API key from .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Takes all the repo files and formats them into one big string for the LLM to read
const formatCodeForAnalysis = (files) => {
  return files.map(file => `
=== FILE: ${file.path} ===
${file.content}
  `).join('\n');
};

// The main analysis function — sends the code to Groq and gets back findings
const analyzeCode = async (files) => {
  const formattedCode = formatCodeForAnalysis(files);

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'You are a code review tool. You only respond with raw JSON, never any text before or after it.'
      },
     {
        role: 'user',
        content: `Analyze the following code and identify bugs, security risks, and technical debt.

Respond with ONLY this JSON format, nothing else:
{
  "issues": [
    {
      "type": "bug",
      "severity": "high",
      "file": "filename.js",
      "line": 12,
      "description": "description here",
      "suggestion": "fix here"
    }
  ],
  "summary": "brief summary"
}

Type must be exactly one of: "bug", "security", "debt"
Severity must be exactly one of: "high", "medium", "low"

Code to analyze:
${formattedCode}`
      }
    ],
    temperature: 0.1,
  });

  const text = response.choices[0].message.content;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON found in response');
  const parsed = JSON.parse(jsonMatch[0]);

  // Normalize types just in case
  parsed.issues = parsed.issues.map(issue => {
    const type = issue.type?.toLowerCase();
    if (type?.includes('security')) issue.type = 'security';
    else if (type?.includes('debt') || type?.includes('technical')) issue.type = 'debt';
    else issue.type = 'bug';
    return issue;
  });

  return parsed;
};

module.exports = { analyzeCode };