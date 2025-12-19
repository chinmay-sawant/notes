import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';

export const NoteView = () => {
  const location = useLocation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If root path, show welcome message or nothing
    if (location.pathname === '/') {
      setContent('# Select a note from the sidebar');
      return;
    }

    setLoading(true);
    setError('');
    
    // The path in URL corresponds to the file path in public
    // e.g. /go/welcome.md -> fetch('/go/welcome.md')
    // With HashRouter, location.pathname is the path after #
    // We need to prepend the base URL to fetch the file correctly
    const baseUrl = import.meta.env.BASE_URL;
    // Remove leading slash from pathname if it exists to join cleanly with base
    const cleanPath = location.pathname.startsWith('/') ? location.pathname.slice(1) : location.pathname;
    const filePath = `${baseUrl}${cleanPath}`;

    fetch(filePath)
      .then(res => {
        if (!res.ok) {
          if (res.headers.get('content-type')?.includes('text/html')) {
             throw new Error('File not found (received HTML instead of Markdown)');
          }
          throw new Error(`Failed to load note: ${res.statusText}`);
        }
        return res.text();
      })
      .then(text => {
        // Basic check to ensure we didn't get the index.html (SPA fallback)
        if (text.trim().startsWith('<!doctype html>')) {
           throw new Error('File not found');
        }
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load note', err);
        setError(err.message);
        setLoading(false);
      });
  }, [location.pathname]);

  if (loading) return <div style={{ padding: '2rem', color: '#888' }}>Loading note...</div>;
  
  if (error) return (
    <div style={{ padding: '2rem', color: '#ff6b6b' }}>
      <h2>Error</h2>
      <p>{error}</p>
      <p>Path: {location.pathname}</p>
    </div>
  );

  return (
    <div className="markdown-body" style={{ backgroundColor: 'transparent', paddingBottom: '4rem' }}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
};
