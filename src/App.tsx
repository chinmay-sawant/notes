import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { NoteView } from './pages/NoteView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<NoteView />} />
          <Route path="*" element={<NoteView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
