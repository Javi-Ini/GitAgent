'use client';

import { useState } from 'react';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [prLinks, setPrLinks] = useState({});
  const [prLoading, setPrLoading] = useState({});

  const analyzeRepo = async () => {
    if (!repoUrl) return;
    setLoading(true);
    setError('');
    setResults(null);
    setPrLinks({});
    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFix = async (issue, index) => {
    setPrLoading(prev => ({ ...prev, [index]: true }));
    try {
      const response = await fetch('http://localhost:3001/api/pr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, issue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create PR');
      setPrLinks(prev => ({ ...prev, [index]: data.prUrl }));
    } catch (err) {
      alert('Failed to create PR: ' + err.message);
    } finally {
      setPrLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const applyAllFixes = async () => {
    if (!results?.issues) return;
    results.issues.forEach((issue, index) => {
      if (!prLinks[index]) applyFix(issue, index);
    });
  };

  const isBug = (issue) => issue.type === 'bug' || issue.description?.toLowerCase().includes('injection') || issue.description?.toLowerCase().includes('error') || issue.description?.toLowerCase().includes('uncaught');
  const isSecurity = (issue) => issue.type === 'security' || issue.description?.toLowerCase().includes('password') || issue.description?.toLowerCase().includes('secret') || issue.description?.toLowerCase().includes('credential') || issue.description?.toLowerCase().includes('vulnerability') || issue.description?.toLowerCase().includes('hardcoded');
  const isDebt = (issue) => issue.type === 'debt' || issue.description?.toLowerCase().includes('unused') || issue.description?.toLowerCase().includes('duplicate') || issue.description?.toLowerCase().includes('callback');

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">GitAgent</h1>
          <p className="text-gray-400">AI-powered code review and security analysis</p>
        </div>
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={analyzeRepo}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">⚙️</div>
            <p className="text-lg">Fetching and analyzing repository...</p>
            <p className="text-sm mt-2">This may take a moment depending on repo size</p>
          </div>
        )}
        {results && (
          <div>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p className="text-gray-300">{results.summary}</p>
              <div className="flex gap-4 mt-4">
                <div className="bg-red-900/40 border border-red-700 rounded px-3 py-1 text-sm text-red-300">
                  Bugs: {results.issues?.filter(isBug).length}
                </div>
                <div className="bg-yellow-900/40 border border-yellow-700 rounded px-3 py-1 text-sm text-yellow-300">
                  Security: {results.issues?.filter(isSecurity).length}
                </div>
                <div className="bg-blue-900/40 border border-blue-700 rounded px-3 py-1 text-sm text-blue-300">
                  Tech Debt: {results.issues?.filter(isDebt).length}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Issues Found</h2>
              <button
                onClick={applyAllFixes}
                className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Apply All Fixes
              </button>
            </div>
            <div className="space-y-4">
              {results.issues?.map((issue, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${issue.type === 'bug' ? 'bg-red-900 text-red-300' : issue.type === 'security' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'}`}>
                      {issue.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${issue.severity === 'high' ? 'bg-red-900 text-red-400' : issue.severity === 'medium' ? 'bg-orange-900 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
                      {issue.severity}
                    </span>
                    <span className="text-gray-500 text-sm">{issue.file} {issue.line ? `(line ${issue.line})` : ''}</span>
                  </div>
                  <p className="text-white mb-2">{issue.description}</p>
                  <p className="text-gray-400 text-sm mb-4">💡 {issue.suggestion}</p>
                  {prLinks[index] ? (
                    <a href={prLinks[index]} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                      View Pull Request
                    </a>
                  ) : (
                    <button
                      onClick={() => applyFix(issue, index)}
                      disabled={prLoading[index]}
                      className="bg-purple-700 hover:bg-purple-600 disabled:bg-purple-900 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      {prLoading[index] ? 'Creating PR...' : 'Apply Fix'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}