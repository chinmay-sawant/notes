import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const MainLayout = () => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%',
      overflow: 'hidden'
    }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--bg-secondary)',
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'background-color 0.2s ease',
      }}>
        <div
          style={{
            maxWidth: '900px',
            width: '100%',
            margin: '0 auto',
            padding: '2.5rem 3rem 4rem',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
