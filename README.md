# GitAgent 🤖

An AI-powered GitHub repository analysis tool that identifies bugs, security vulnerabilities, and technical debt across codebases — and automates fixes via pull requests.

## Overview

GitAgent was built to make code review faster and more accessible. Instead of manually reviewing every file, you paste a GitHub repository URL and let the AI do the heavy lifting.

## Features

- **AI Code Analysis** — Analyzes repositories for bugs, security risks, and technical debt
- **Detailed Findings** — Each issue includes a description, severity level, affected file, and suggested fix
- **Automated PR Creation** — Apply fixes directly from the dashboard; GitAgent creates a new branch and opens a pull request on GitHub
- **Full-Stack Dashboard** — Clean Next.js UI to visualize repo health and manage findings in real time

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** Groq API (Llama 3.1)
- **GitHub Integration:** Octokit / GitHub REST API

## How It Works

1. User inputs a GitHub repository URL into the dashboard
2. Backend fetches all code files via the GitHub API
3. Code is sent to an LLM for analysis
4. Findings are returned and displayed on the dashboard
5. User can approve fixes — GitAgent creates a branch and opens a pull request with suggested changes

## Setup

```bash
# Clone the repo
git clone https://github.com/Javi-Ini/GitAgent.git

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Add environment variables
# Create backend/.env with:
# GITHUB_TOKEN=your_github_pat
# GROQ_API_KEY=your_groq_key
# PORT=3001

# Run backend
cd backend && node src/index.js

# Run frontend
cd frontend && npm run dev
```

Visit `localhost:3000`