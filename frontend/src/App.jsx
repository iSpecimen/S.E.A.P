
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import StartPage from './pages/StartPage';
import MainPage from './pages/MainPage';

// The app only has 2 pages, the start page and the main page
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;