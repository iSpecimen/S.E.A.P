// ============================================================================
// StartPage.jsx
// ============================================================================
//
// Entry point for the application: it's the start screen the user sees.
//
// Navigation flow (without a router):
//   1. User fills in parameters and clicks "Start Simulation"
//   2. createSimulation() is called, and then React context creates a tab with loadingset to true
//   3. Because activeSim now exists, App.jsx switches to MainPage
//   4. MainPage shows "Running simulation..." while backend processes
//   5. When backend finishes and stateLog arrives, MainPage renders the sim
//
// Input constraints (from design doc UIT.10):
//   - Runways: 1–10
//   - Inbound flow: 0–200 planes/hour
//   - Outbound flow: 0–200 planes/hour
//   Backend validates max flow against runway count and mode configuration.

import { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import planeLogo from '../assets/plane-4.png';
import './StartPage.css';

/**
 * StartPage: Initial configuration screen for launching a new simulation.
 *
 The component collects user input and fires createSimulation() on submit. Once called,
 * context handles everything: tab creation, backend communication, and
 * the automatic page switch via App.jsx.
 *
 * The submit button is disabled after clicking to prevent duplicate
 * submissions while the backend is processing.
 */
export default function StartPage() {
  const [numRunways, setNumRunways] = useState(3);
  const [inboundFlow, setInboundFlow] = useState(15);
  const [outboundFlow, setOutboundFlow] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  const { createSimulation } = useSimulation();

  const handleStart = () => {
    if (submitting) return;
    setSubmitting(true);

    // createSimulation sets activeSim (with loading: true), which causes App.jsx to switch to MainPage.
    createSimulation({ numRunways, inboundFlow, outboundFlow });
  };

  return (
    <div className="start-bg">
      <div className="start-card">

        {/* Animated logo with embedded plane icon */}
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

        {/* Parameter inputs — three numeric fields for simulation config */}
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

        {/* Submit — disabled after click to prevent duplicate submissions */}
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