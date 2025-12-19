import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileTree, FileNode } from './FileTree';
import { DevToolsModal, type DevToolsModalSubmit } from './DevToolsModal';

export const Sidebar = () => {
  const [width, setWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devModalMode, setDevModalMode] = useState<'new-file' | 'new-folder' | 'from-clipboard'>('new-file');
  const [devModalTitle, setDevModalTitle] = useState('');
  const [devModalDefaultFileName, setDevModalDefaultFileName] = useState('');
  const [devModalInitialContent, setDevModalInitialContent] = useState('');

  const showDevTools = typeof window !== 'undefined' && window.location.href.includes('localhost');

  const allDirPaths = useMemo(() => {
    const dirs: string[] = [];
    const walk = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          dirs.push(n.path);
          if (n.children) walk(n.children);
        }
      }
    };
    walk(treeData);
    return dirs;
  }, [treeData]);

  const isAllExpanded = useMemo(() => {
    if (allDirPaths.length === 0) return false;
    return allDirPaths.every((p) => expandedPaths.has(p));
  }, [allDirPaths, expandedPaths]);

  const folderOptions = useMemo(() => {
    const options: { label: string; path: string }[] = [{ label: '/', path: '' }];
    const walk = (nodes: FileNode[], depth: number) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          const indent = depth ? `${'  '.repeat(depth)}- ` : '';
          options.push({ label: `${indent}${n.path}`, path: n.path });
          if (n.children) walk(n.children, depth + 1);
        }
      }
    };
    walk(treeData, 0);
    return options;
  }, [treeData]);

  const fetchIndex = async () => {
    const baseUrl = import.meta.env.BASE_URL;
    const url = `${baseUrl}notes-index.json?ts=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    setTreeData(data);
  };

  useEffect(() => {
    fetchIndex().catch((err) => console.error('Failed to load notes index', err));
  }, []);

  useEffect(() => {
    // Auto-expand the folder path of the currently open file
    const pathname = location.pathname;
    if (!pathname || pathname === '/') return;

    const clean = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const segments = clean.split('/').filter(Boolean);
    if (segments.length <= 1) return;

    setExpandedPaths((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < segments.length - 1; i++) {
        const dirPath = segments.slice(0, i + 1).join('/');
        next.add(dirPath);
      }
      return next;
    });
  }, [location.pathname]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleDir = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleExpandCollapseAll = () => {
    setExpandedPaths(() => {
      if (!isAllExpanded) return new Set(allDirPaths);
      return new Set();
    });
  };

  const isoStamp = () => new Date().toISOString().replace(/[:.]/g, '-');

  const refreshIndexAndReload = async () => {
    // Regenerate on dev server, then re-fetch.
    const baseUrl = import.meta.env.BASE_URL;
    await fetch(`${baseUrl}__notes/refresh`, { cache: 'no-store' });
    await fetchIndex();
  };

  const openDevModal = async (mode: 'new-file' | 'new-folder' | 'from-clipboard') => {
    if (!showDevTools) return;

    setDevModalMode(mode);

    if (mode === 'new-folder') {
      setDevModalTitle('Create folder');
      setDevModalDefaultFileName('');
      setDevModalInitialContent('');
    }

    if (mode === 'new-file') {
      setDevModalTitle('Create markdown file');
      setDevModalDefaultFileName(`note-${isoStamp()}.md`);
      setDevModalInitialContent('');
    }

    if (mode === 'from-clipboard') {
      setDevModalTitle('Create from clipboard');
      setDevModalDefaultFileName(`clip-${isoStamp()}.md`);
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = '';
      }
      setDevModalInitialContent(text);
    }

    setDevModalOpen(true);
  };

  const submitDevModal = async (payload: DevToolsModalSubmit) => {
    const baseUrl = import.meta.env.BASE_URL;
    const toJson = (obj: unknown) => JSON.stringify(obj);

    if (payload.mode === 'new-folder') {
      const res = await fetch(`${baseUrl}__notes/mkdir`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: toJson({ folderPath: payload.folderPath, folderName: payload.folderName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create folder');
    }

    if (payload.mode === 'new-file') {
      const res = await fetch(`${baseUrl}__notes/write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: toJson({ folderPath: payload.folderPath, fileName: payload.fileName, content: `# ${payload.fileName.replace(/\\.md$/, '')}\n\n` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create file');
    }

    if (payload.mode === 'from-clipboard') {
      const res = await fetch(`${baseUrl}__notes/write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: toJson({ folderPath: payload.folderPath, fileName: payload.fileName, content: payload.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create file');
    }

    await refreshIndexAndReload();
  };

  const onRefresh = async () => {
    try {
      await refreshIndexAndReload();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const iconBtn: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#ddd',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: 1,
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
        padding: '0.75rem 1rem', 
        borderBottom: '1px solid #333',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>Notes</div>
        </div>

        {showDevTools && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="toolbtn" data-tip="New file" title="New file" style={iconBtn} onClick={() => openDevModal('new-file')}>
              📝
            </button>
            <button className="toolbtn" data-tip="New folder" title="New folder" style={iconBtn} onClick={() => openDevModal('new-folder')}>
              📁
            </button>
            <button className="toolbtn" data-tip="Refresh index" title="Refresh index" style={iconBtn} onClick={onRefresh}>
              🔄
            </button>
            <button
              className="toolbtn"
              data-tip={isAllExpanded ? 'Collapse all' : 'Expand all'}
              title={isAllExpanded ? 'Collapse all' : 'Expand all'}
              style={iconBtn}
              onClick={toggleExpandCollapseAll}
            >
              🗂️
            </button>
            <button className="toolbtn" data-tip="From clipboard" title="From clipboard" style={iconBtn} onClick={() => openDevModal('from-clipboard')}>
              📋
            </button>
          </div>
        )}
      </div>

      <DevToolsModal
        open={devModalOpen}
        mode={devModalMode}
        title={devModalTitle}
        folderOptions={folderOptions}
        defaultFolderPath={folderOptions.find((o) => o.path)?.path ?? ''}
        defaultFileName={devModalDefaultFileName}
        initialContent={devModalInitialContent}
        onClose={() => setDevModalOpen(false)}
        onSubmit={submitDevModal}
      />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        <FileTree nodes={treeData} expandedPaths={expandedPaths} onToggleDir={toggleDir} />
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

        .tree-row:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }

        .toolbtn:hover {
          border-color: rgba(100, 108, 255, 0.8) !important;
          background-color: rgba(100, 108, 255, 0.08) !important;
        }

        /* Simple tooltip */
        .toolbtn {
          position: relative;
        }

        .toolbtn:hover::after {
          content: attr(data-tip);
          position: absolute;
          top: 30px;
          right: 0;
          background: rgba(10, 10, 10, 0.95);
          border: 1px solid #333;
          color: #ddd;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 50;
          pointer-events: none;
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        }
      `}</style>
    </div>
  );
};
