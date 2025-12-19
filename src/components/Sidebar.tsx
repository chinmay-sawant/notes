import { useState, useEffect, useRef } from 'react';
import { FileTree, FileNode } from './FileTree';

export const Sidebar = () => {
  const [width, setWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}notes-index.json`)
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(err => console.error('Failed to load notes index', err));
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const stopResizing = () => setIsResizing(false);
    const resize = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth > 150 && newWidth < 600) {
          setWidth(newWidth);
        }
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  return (
    <div 
      ref={sidebarRef}
      style={{ 
        width: width, 
        minWidth: width,
        backgroundColor: '#1a1a1a', 
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #333',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        Notes
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        <FileTree nodes={treeData} />
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={startResizing}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#646cff' : 'transparent',
          transition: 'background-color 0.2s',
          zIndex: 10
        }}
        className="resizer-handle"
      />
      <style>{`
        .resizer-handle:hover {
          background-color: #646cff !important;
        }
      `}</style>
    </div>
  );
};
