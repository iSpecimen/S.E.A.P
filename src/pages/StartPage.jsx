import { useState } from 'react';

import './StartPage.css';

export default function StartPage() {
  const [numRunways, setNumRunways] = useState(3);
  const [inboundFlow, setInboundFlow] = useState(15);
  const [outboundFlow, setOutboundFlow] = useState(15);

  return (
    <div className="start-bg">
      <div className="start-card">

        <div className="logo-pill">
          <span className="logo-text">
            SE
            <span className="a-container">
              <div className="a-shape"></div>
              <img src="/plane-4.png" className="plane-overlay" alt="plane" />
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

        <button className="start-btn">Start Simulation</button>
      </div>
    </div>
  );
}