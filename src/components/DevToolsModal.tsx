import { useEffect, useMemo, useState } from 'react';

type Mode = 'new-file' | 'new-folder' | 'from-clipboard';

export type DevToolsModalSubmit =
  | { mode: 'new-folder'; folderPath: string; folderName: string }
  | { mode: 'new-file'; folderPath: string; fileName: string }
  | { mode: 'from-clipboard'; folderPath: string; fileName: string; content: string };

export interface FolderOption {
  label: string;
  path: string;
}

export const DevToolsModal = ({
  open,
  mode,
  folderOptions,
  defaultFolderPath,
  defaultFileName,
  initialContent,
  title,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: Mode;
  folderOptions: FolderOption[];
  defaultFolderPath: string;
  defaultFileName: string;
  initialContent: string;
  title: string;
  onClose: () => void;
  onSubmit: (payload: DevToolsModalSubmit) => Promise<void> | void;
}) => {
  const [folderPath, setFolderPath] = useState(defaultFolderPath);
  const [fileName, setFileName] = useState(defaultFileName);
  const [folderName, setFolderName] = useState('');
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFolderMode = mode === 'new-folder';
  const isClipboardMode = mode === 'from-clipboard';

  const canSubmit = useMemo(() => {
    if (!open) return false;
    if (isFolderMode) return Boolean(folderName.trim());
    if (isClipboardMode) return Boolean(fileName.trim()) && Boolean(content.trim());
    return Boolean(fileName.trim());
  }, [open, isFolderMode, isClipboardMode, folderName, fileName, content]);

  useEffect(() => {
    if (!open) return;
    setFolderPath(defaultFolderPath);
    setFileName(defaultFileName);
    setFolderName('');
    setContent(initialContent);
    setSaving(false);
    setError('');
  }, [open, defaultFolderPath, defaultFileName, initialContent]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    try {
      if (!canSubmit) return;
      setSaving(true);
      setError('');

      const cleanFolderPath = folderPath.trim().replace(/^\/+/, '').replace(/\/+$/, '');

      if (mode === 'new-folder') {
        await onSubmit({ mode, folderPath: cleanFolderPath, folderName: folderName.trim() });
      } else if (mode === 'new-file') {
        const name = fileName.trim().endsWith('.md') ? fileName.trim() : `${fileName.trim()}.md`;
        await onSubmit({ mode, folderPath: cleanFolderPath, fileName: name });
      } else {
        const name = fileName.trim().endsWith('.md') ? fileName.trim() : `${fileName.trim()}.md`;
        await onSubmit({ mode, folderPath: cleanFolderPath, fileName: name, content });
      }

      onClose();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setSaving(false);
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  };

  const panel: React.CSSProperties = {
    width: 'min(560px, 100%)',
    borderRadius: '12px',
    border: '1px solid #333',
    background: '#141414',
    boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
    overflow: 'hidden',
  };

  const header: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  const body: React.CSSProperties = {
    padding: '16px',
    display: 'grid',
    gap: '12px',
  };

  const label: React.CSSProperties = {
    fontSize: '12px',
    color: '#a0a0a0',
    marginBottom: '6px',
  };

  const input: React.CSSProperties = {
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#eaeaea',
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const textarea: React.CSSProperties = {
    ...input,
    minHeight: '160px',
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '12px',
    lineHeight: 1.5,
  };

  const footer: React.CSSProperties = {
    padding: '14px 16px',
    borderTop: '1px solid #333',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  };

  const btn: React.CSSProperties = {
    borderRadius: '10px',
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#eaeaea',
    padding: '10px 12px',
    cursor: 'pointer',
  };

  const primaryBtn: React.CSSProperties = {
    ...btn,
    border: '1px solid rgba(100, 108, 255, 0.8)',
    background: 'rgba(100, 108, 255, 0.14)',
  };

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={panel} onMouseDown={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button style={btn} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={body}>
          <div>
            <div style={label}>Folder</div>
            <select
              style={input}
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
            >
              {folderOptions.map((o) => (
                <option key={o.path} value={o.path}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {mode === 'new-folder' ? (
            <div>
              <div style={label}>Folder name</div>
              <input
                style={input}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. go"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <div style={label}>File name</div>
              <input
                style={input}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. my-note.md"
                autoFocus
              />
            </div>
          )}

          {mode === 'from-clipboard' && (
            <div>
              <div style={label}>Content</div>
              <textarea
                style={textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type markdown here"
              />
            </div>
          )}

          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '12px' }}>{error}</div>
          )}
        </div>

        <div style={footer}>
          <button style={btn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button style={primaryBtn} onClick={submit} disabled={saving || !canSubmit}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
