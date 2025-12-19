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
        overflowY: 'auto',
        backgroundColor: '#242424',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 3rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
