// ============================================================================
// App.jsx
// ============================================================================
//
// No routing library needed. We just check: does a simulation exist in context?
//   - No  → show StartPage
//   - Yes → show MainPage
//
// When createSimulation finishes and sets stateLog in context, React
// automatically re-renders and switches to MainPage. No navigate() needed.
//

import { SimulationProvider, useSimulation } from "./context/SimulationContext";
import StartPage from "./pages/StartPage";
import MainPage from "./pages/MainPage";

function AppContent() {
  const { activeTabID } = useSimulation();

  if (activeTabID) {
    return <MainPage />;
  }

  return <StartPage />;
}

function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;