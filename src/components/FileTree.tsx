import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  title?: string;
  children?: FileNode[];
}

interface FileTreeProps {
  nodes: FileNode[];
  level?: number;
}

export const FileTree = ({ nodes, level = 0 }: FileTreeProps) => {
  const location = useLocation();

  return (
    <div style={{ paddingLeft: level ? '12px' : '0' }}>
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} level={level} currentPath={location.pathname} />
      ))}
    </div>
  );
};

const FileTreeNode = ({ node, level, currentPath }: { node: FileNode; level: number; currentPath: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if this file is currently active
  // We decodeURIComponent because URL paths might be encoded
  const isActive = node.type === 'file' && decodeURIComponent(currentPath) === `/${node.path}`;

  if (node.type === 'directory') {
    return (
      <div>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            cursor: 'pointer',
            color: '#e0e0e0',
            fontSize: '0.9rem',
            userSelect: 'none',
            borderRadius: '4px',
          }}
          className="hover:bg-gray-800"
        >
          <span style={{ marginRight: '4px', display: 'flex' }}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span style={{ marginRight: '6px', color: '#fbbf24' }}>
            <Folder size={16} fill="currentColor" />
          </span>
          <span style={{ fontWeight: 500 }}>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <FileTree nodes={node.children} level={level + 1} />
        )}
      </div>
    );
  }

  return (
    <Link 
      to={`/${node.path}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        paddingLeft: '28px', // Indent to align with folder text
        textDecoration: 'none',
        color: isActive ? '#646cff' : '#a0a0a0',
        fontSize: '0.9rem',
        backgroundColor: isActive ? 'rgba(100, 108, 255, 0.1)' : 'transparent',
        borderRadius: '4px',
        marginBottom: '1px'
      }}
    >
      <span style={{ marginRight: '6px' }}>
        <FileText size={14} />
      </span>
      <span style={{ 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' 
      }}>
        {node.title || node.name}
      </span>
    </Link>
  );
};
