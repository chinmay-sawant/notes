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
            padding: '7px 10px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.15s ease',
            marginBottom: '1px',
          }}
          className="tree-row"
          title={`${isOpen ? 'Collapse' : 'Expand'} folder: ${node.path}`}
        >
          <span style={{ 
            width: '20px', 
            height: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px', 
            color: 'var(--text-muted)',
            fontSize: '11px',
            transition: 'transform 0.15s ease',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            ▶
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
        padding: '7px 10px',
        paddingLeft: '38px',
        textDecoration: 'none',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '0.875rem',
        backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
        borderRadius: '6px',
        marginBottom: '1px',
        transition: 'all 0.15s ease',
        fontWeight: isActive ? 500 : 400,
      }}
      className="tree-row"
      title={node.path}
    >
      <span style={{ 
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: isActive ? 'var(--accent)' : 'var(--text-muted)',
        marginRight: '10px',
        flexShrink: 0,
        opacity: isActive ? 1 : 0.5,
      }} />
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
