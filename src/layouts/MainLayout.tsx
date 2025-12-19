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
        backgroundColor: '#242424',
        position: 'relative',
        padding: '2rem 3rem',
        boxSizing: 'border-box'
      }}>
        <div
          style={{
            width: '100%',
            minWidth: 0,
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
