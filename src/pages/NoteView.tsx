import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-dark.css';

interface Note {
  id: string;
  title: string;
  filename: string;
  date: string;
}

export const NoteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First fetch the index to find the filename for this ID
    // In a real app, you might just use the ID as filename or have a better API
    fetch('/go/index.json')
      .then(res => res.json())
      .then((notes: Note[]) => {
        const note = notes.find(n => n.id === id);
        if (!note) {
          navigate('/');
          return;
        }
        
        return fetch(`/go/${note.filename}`);
      })
      .then(res => {
        if (!res) return;
        return res.text();
      })
      .then(text => {
        if (text) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load note', err);
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) return <div>Loading note...</div>;

  return (
    <div className="markdown-body" style={{ backgroundColor: 'transparent', padding: '1rem 0' }}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
};
