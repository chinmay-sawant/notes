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
  expandedPaths: ReadonlySet<string>;
  onToggleDir: (path: string) => void;
  onSelectPath?: (path: string, type: FileNode['type']) => void;
}

export const FileTree = ({ nodes, level = 0, expandedPaths, onToggleDir, onSelectPath }: FileTreeProps) => {
  const location = useLocation();

  return (
    <div style={{ paddingLeft: level ? '12px' : '0' }}>
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={level}
          currentPath={location.pathname}
          expandedPaths={expandedPaths}
          onToggleDir={onToggleDir}
          onSelectPath={onSelectPath}
        />
      ))}
    </div>
  );
};

const FileTreeNode = ({
  node,
  level,
  currentPath,
  expandedPaths,
  onToggleDir,
  onSelectPath,
}: {
  node: FileNode;
  level: number;
  currentPath: string;
  expandedPaths: ReadonlySet<string>;
  onToggleDir: (path: string) => void;
  onSelectPath?: (path: string, type: FileNode['type']) => void;
}) => {
  
  // Check if this file is currently active
  // We decodeURIComponent because URL paths might be encoded
  const isActive = node.type === 'file' && decodeURIComponent(currentPath) === `/${node.path}`;
  const isOpen = node.type === 'directory' && expandedPaths.has(node.path);

  if (node.type === 'directory') {
    return (
      <div>
        <div 
          onClick={() => {
            onSelectPath?.(node.path, 'directory');
            onToggleDir(node.path);
          }}
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
          className="tree-row"
          title={`${isOpen ? 'Collapse' : 'Expand'} folder: ${node.path}`}
        >
          <span style={{ width: '18px', marginRight: '4px', textAlign: 'center', opacity: 0.9 }}>
            {isOpen ? '▾' : '▸'}
          </span>
          <span style={{ width: '18px', marginRight: '6px' }}>
            {isOpen ? '📂' : '📁'}
          </span>
          <span style={{ fontWeight: 500 }}>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <FileTree
            nodes={node.children}
            level={level + 1}
            expandedPaths={expandedPaths}
            onToggleDir={onToggleDir}
            onSelectPath={onSelectPath}
          />
        )}
      </div>
    );
  }

  return (
    <Link 
      to={`/${node.path}`}
      onClick={() => onSelectPath?.(node.path, 'file')}
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
      className="tree-row"
      title={node.path}
    >
      <span style={{ width: '18px', marginRight: '6px' }}>📝</span>
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
