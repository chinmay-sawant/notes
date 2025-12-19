import { Outlet, Link } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <header style={{ 
        marginBottom: '2rem', 
        borderBottom: '1px solid #333', 
        paddingBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Notes App</h1>
        </Link>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};
