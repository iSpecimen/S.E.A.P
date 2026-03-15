// ============================================================================
// App.jsx
// ============================================================================
//
// Root component of the application. Wraps everything in SimulationProvider
// so all child components can access shared simulation state via useSimulation().
//
// Navigation is handled without a routing library, we simply check whether
// an active simulation tab exists in context:
//   - No activeTabID : render StartPage (user enters parameters)
//   - Has activeTabID : render MainPage (simulation view)
//
// This works because:
//   1. StartPage calls createSimulation() which sets activeTabID in context
//   2. React re-renders AppContent, which now sees activeTabID and switches to MainPage
//   3. If the user clicks "+ New Simulation", context clears activeTabID,
//      triggering a re-render back to StartPage
//


import { SimulationProvider, useSimulation } from "./context/SimulationContext";
import StartPage from "./pages/StartPage";
import MainPage from "./pages/MainPage";

/**
 * Reads activeTabID from context to decide which page to render.
 * Separated from App so it can call useSimulation() inside the provider.
 */
function AppContent() {
  const { activeTabID } = useSimulation();

  // If a simulation tab exists, show the simulation view
  if (activeTabID) {
    return <MainPage />;
  }

  // Otherwise, show the start page for new simulation config
  return <StartPage />;
}

/**
 * App: Top-level component. Wraps AppContent in SimulationProvider so
 * the entire component tree has access to shared simulation state.
 */
function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;