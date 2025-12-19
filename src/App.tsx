import { HashRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { NoteView } from './pages/NoteView';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<NoteView />} />
          <Route path="*" element={<NoteView />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
