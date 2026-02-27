
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import StartPage from './pages/StartPage';
import MainPage from './pages/mainPage';
import { SimulationProvider } from './context/SimulationContext';

function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/main" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  );
}


export default App;