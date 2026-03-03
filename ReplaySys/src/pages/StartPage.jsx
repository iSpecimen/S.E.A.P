// ============================================================================
// StartPage.jsx
// ============================================================================
//
// When the user clicks "Start Simulation":
//   1. createSimulation() is called
//   2. Context immediately creates a tab with loading: true
//   3. Because activeSim now exists, App.jsx switches to MainPage
//   4. MainPage shows "Running simulation..." while backend processes
//   5. When backend finishes and stateLog is set, MainPage renders the sim
//
// No navigate() or routing needed — App.jsx handles the switch automatically.
//

import { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import planeLogo from '../assets/plane-4.png';
import './StartPage.css';

export default function StartPage() {
  const [numRunways, setNumRunways] = useState(3);
  const [inboundFlow, setInboundFlow] = useState(15);
  const [outboundFlow, setOutboundFlow] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  const { createSimulation } = useSimulation();

  const handleStart = () => {
    if (submitting) return;
    setSubmitting(true);

    // Fire and forget — createSimulation sets activeSim immediately
    // (with loading: true), which causes App.jsx to switch to MainPage.
    // MainPage then shows "Running simulation..." until stateLog arrives.
    createSimulation({ numRunways, inboundFlow, outboundFlow });
  };

  return (
    <div className="start-bg">
      <div className="start-card">

        <div className="logo-pill">
          <span className="logo-text">
            SE
            <span className="a-container">
              <div className="a-shape"></div>
              <img src={planeLogo} className="plane-overlay" alt="plane" />
            </span>
            P
          </span>
          <span className="logo-sub">Airport Simulation</span>
        </div>

        <div className="inputs">
          <div className="field">
            <input
              type="number" min={1} max={10}
              value={numRunways}
              onChange={e => setNumRunways(Number(e.target.value))}
            />
            <label>Runways</label>
          </div>
          <div className="field">
            <input
              type="number" min={0} max={200}
              value={inboundFlow}
              onChange={e => setInboundFlow(Number(e.target.value))}
            />
            <label>Inbound Flow (/hr)</label>
          </div>
          <div className="field">
            <input
              type="number" min={0} max={200}
              value={outboundFlow}
              onChange={e => setOutboundFlow(Number(e.target.value))}
            />
            <label>Outbound Flow (/hr)</label>
          </div>
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={submitting}
        >
          {submitting ? "Starting..." : "Start Simulation"}
        </button>
      </div>
    </div>
  );
}