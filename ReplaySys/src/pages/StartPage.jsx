// ============================================================================
// StartPage.jsx
// ============================================================================
//
// Entry point for the application: it's the start screen the user sees.
//
// Navigation flow (without a router):
//   1. User fills in parameters and clicks "Start Simulation"
//   2. createSimulation() is called, and then React context creates a tab with loading set to true
//   3. Because activeSim now exists, App.jsx switches to MainPage
//   4. MainPage shows "Running simulation..." while backend processes
//   5. When backend finishes and stateLog arrives, MainPage renders the sim
//
// Input constraints (from design doc UIT.10):
//   - Runways: 1–10
//   - Inbound flow: 0 to 40 * numRunways planes/hour
//   - Outbound flow: 0 to 40 * numRunways planes/hour
//   Backend validates max flow against runway count and mode configuration.

import { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import planeLogo from '../assets/plane-4.png';
import './StartPage.css';

/**
 * StartPage: Initial configuration screen for launching a new simulation.
 *
 * The component collects user input and fires createSimulation() on submit. Once called,
 * context handles everything: tab creation, backend communication, and
 * the automatic page switch via App.jsx.
 *
 * State is stored as strings to allow free typing (select-all, delete, retype).
 * Values are clamped to valid ranges and converted to numbers on submit.
 * The submit button is disabled after clicking to prevent duplicate submissions.
 */
export default function StartPage() {
  const [numRunways, setNumRunways] = useState("3");
  const [inboundFlow, setInboundFlow] = useState("15");
  const [outboundFlow, setOutboundFlow] = useState("15");
  const [submitting, setSubmitting] = useState(false);

  const { createSimulation } = useSimulation();

  // Derived numeric value for dynamic max calculation on flow inputs
  const runwayCount = Number(numRunways) || 1;

  const handleStart = () => {
    if (submitting) return;
    setSubmitting(true);

    // Convert string state to numbers for the backend
    createSimulation({
      numRunways: Number(numRunways) || 1,
      inboundFlow: Number(inboundFlow) || 0,
      outboundFlow: Number(outboundFlow) || 0,
    });
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
              onChange={e => setNumRunways(e.target.value)}
              onBlur={() => {
                const val = Math.max(1, Math.min(10, Number(numRunways) || 1));
                setNumRunways(String(val));
                const newMax = 40 * val;
                setInboundFlow(prev => String(Math.min(Number(prev) || 0, newMax)));
                setOutboundFlow(prev => String(Math.min(Number(prev) || 0, newMax)));
              }}
            />
            <label>Runways</label>
          </div>
          <div className="field">
            <input
              type="number" min={0} max={40 * runwayCount}
              value={inboundFlow}
              onChange={e => setInboundFlow(e.target.value)}
              onBlur={() => {
                const val = Math.max(0, Math.min(40 * runwayCount, Number(inboundFlow) || 0));
                setInboundFlow(String(val));
              }}
            />
            <label>Inbound Flow (/hr) — max {40 * runwayCount}</label>
          </div>
          <div className="field">
            <input
              type="number" min={0} max={40 * runwayCount}
              value={outboundFlow}
              onChange={e => setOutboundFlow(e.target.value)}
              onBlur={() => {
                const val = Math.max(0, Math.min(40 * runwayCount, Number(outboundFlow) || 0));
                setOutboundFlow(String(val));
              }}
            />
            <label>Outbound Flow (/hr) — max {40 * runwayCount}</label>
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