import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileTree, FileNode } from './FileTree';

export const Sidebar = () => {
  const [width, setWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [publicDirHandle, setPublicDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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

  const ensureFsApi = () => {
    if (!showDevTools) throw new Error('Dev tools are disabled on non-localhost URLs');
    if (!window.isSecureContext) throw new Error('Requires a secure context (localhost is OK)');
    if (!('showDirectoryPicker' in window)) throw new Error('File System Access API not available in this browser');
  };

  const getPublicHandle = async () => {
    ensureFsApi();
    if (publicDirHandle) return publicDirHandle;
    // Ask user to pick the /public folder in this repo
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    setPublicDirHandle(handle);
    return handle as FileSystemDirectoryHandle;
  };

  const getDirHandleByPath = async (root: FileSystemDirectoryHandle, relPath: string, create: boolean) => {
    const parts = relPath.split('/').filter(Boolean);
    let dir = root;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create });
    }
    return dir;
  };

  const promptFolderPath = () => {
    const defaultValue = folderOptions.find((o) => o.path)?.path ?? '';
    const val = window.prompt(
      'Folder under public (e.g. go/java). Leave empty for /public root:',
      defaultValue,
    );
    return val === null ? null : val.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  };

  const refreshIndexAndReload = async () => {
    // Regenerate on dev server, then re-fetch.
    const baseUrl = import.meta.env.BASE_URL;
    await fetch(`${baseUrl}__notes/refresh`, { cache: 'no-store' });
    await fetchIndex();
  };

  const onNewFolder = async () => {
    try {
      // IMPORTANT: some browsers require showDirectoryPicker to be the first awaited
      // action in a user-gesture handler. Do this before prompts/other async work.
      const publicHandle = await getPublicHandle();

      const folder = promptFolderPath();
      if (folder === null) return;
      const name = window.prompt('New folder name:', `folder-${Date.now()}`);
      if (!name) return;

      const targetDir = await getDirHandleByPath(publicHandle, folder, true);
      await targetDir.getDirectoryHandle(name, { create: true });
      await refreshIndexAndReload();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const onNewFile = async () => {
    try {
      // IMPORTANT: some browsers require showDirectoryPicker to be the first awaited
      // action in a user-gesture handler. Do this before prompts/other async work.
      const publicHandle = await getPublicHandle();

      const folder = promptFolderPath();
      if (folder === null) return;

      const defaultName = `note-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
      const nameInput = window.prompt('New markdown file name (.md):', defaultName);
      if (!nameInput) return;
      const fileName = nameInput.endsWith('.md') ? nameInput : `${nameInput}.md`;

      const targetDir = await getDirHandleByPath(publicHandle, folder, true);
      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(`# ${fileName.replace(/\.md$/, '')}\n\n`);
      await writable.close();
      await refreshIndexAndReload();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const onFromClipboard = async () => {
    try {
      // IMPORTANT: some browsers require showDirectoryPicker to be the first awaited
      // action in a user-gesture handler. Do this before prompts/other async work.
      const publicHandle = await getPublicHandle();

      const folder = promptFolderPath();
      if (folder === null) return;

      const defaultName = `clip-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
      const nameInput = window.prompt('Markdown file name for clipboard content (.md):', defaultName);
      if (!nameInput) return;
      const fileName = nameInput.endsWith('.md') ? nameInput : `${nameInput}.md`;

      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch {
        const manual = window.prompt('Clipboard read blocked. Paste content here:', '');
        if (manual === null) return;
        text = manual;
      }

      const targetDir = await getDirHandleByPath(publicHandle, folder, true);
      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      await refreshIndexAndReload();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
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
            <button className="toolbtn" data-tip="New file" title="New file" style={iconBtn} onClick={onNewFile}>
              📝
            </button>
            <button className="toolbtn" data-tip="New folder" title="New folder" style={iconBtn} onClick={onNewFolder}>
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
            <button className="toolbtn" data-tip="From clipboard" title="From clipboard" style={iconBtn} onClick={onFromClipboard}>
              📋
            </button>
          </div>
        )}
      </div>
      
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
