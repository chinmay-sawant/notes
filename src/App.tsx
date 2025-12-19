import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { NoteList } from './pages/NoteList';
import { NoteView } from './pages/NoteView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<NoteList />} />
          <Route path="note/:id" element={<NoteView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
