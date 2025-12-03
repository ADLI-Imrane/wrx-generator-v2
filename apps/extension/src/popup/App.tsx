import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShorten = async () => {
    setLoading(true);
    try {
      // Get current tab URL if no URL provided
      if (!url) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          setUrl(tab.url);
        }
      }
      // API call will be implemented
      setShortUrl('https://wrx.io/abc123');
    } catch (error) {
      console.error('Error shortening URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-container">
      <h1>WRX Generator</h1>
      <div className="input-group">
        <input
          type="url"
          placeholder="Enter URL or use current page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleShorten} disabled={loading}>
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </div>
      {shortUrl && (
        <div className="result">
          <p>Short URL:</p>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
