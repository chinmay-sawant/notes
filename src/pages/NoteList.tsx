import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  filename: string;
  date: string;
}

export const NoteList = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/go/index.json')
      .then(res => res.json())
      .then(data => {
        setNotes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load notes index', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading notes...</div>;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {notes.map(note => (
        <Link 
          key={note.id} 
          to={`/note/${note.id}`}
          style={{
            display: 'block',
            padding: '1.5rem',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid #333',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>{note.title}</h2>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>{note.date}</div>
        </Link>
      ))}
    </div>
  );
};
