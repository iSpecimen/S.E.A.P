import React, { useState, useEffect } from 'react';
import './Statistics.css'
import { useSimulation } from '../context/SimulationContext';
function ConfigBox({ label, value, onApply, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleApply = () => {
    const clamped = Math.max(0, Number(draft));
    setEditing(false);
    onApply(clamped);
  };

  return (
    <div className="configBox">
      <label>{label}</label>
      {editing ? (
        <input
          type="number"
          value={draft}
          min={0}
          onChange={(e) => setDraft(Math.max(0, Number(e.target.value)))}
          autoFocus
        />
      ) : (
        <span className="configValue">{value}</span>
      )}
      <button
        className={`configBtn ${editing ? 'applyBtn' : 'editBtn'}`}
        disabled={disabled && !editing}
        onClick={editing ? handleApply : () => { setDraft(value); setEditing(true); }}
      >
        {editing ? '✔' : '✎'}
      </button>
    </div>
  );
}

export default function Statistics({
  maxInTakeoff, maxInHolding,
  avgWaitTakeoff, avgWaitHolding,
  maxDelayTakeoff, maxDelayHolding,   
  avgDelayTakeoff, avgDelayArrival,
  maxWaitConfig, onMaxWaitConfigChange,
  totalCancelled, totalDiverted
}) {
  const { activeSim } = useSimulation();
  const isPlaying = activeSim?.playState === "playing";
  return (
    <div className="statistics">
      <div className="statisticsHeader">
        <h2 className="statisticsTitle">Statistics</h2>
      </div>
      <div className="statisticsGrid">
        <div className="statCard">
          <span className="statCardTitle">Max No. In</span>
          <span className="statCardSubtitle">Take-off Queue</span>
          <span className="statCardValue">{maxInTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Max No. In</span>
          <span className="statCardSubtitle">Holding Pattern</span>
          <span className="statCardValue">{maxInHolding ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Avg Wait Time (min)</span>
          <span className="statCardSubtitle">Take-off Queue</span>
          <span className="statCardValue">{avgWaitTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Avg Wait Time (min)</span>
          <span className="statCardSubtitle">Holding Pattern</span>
          <span className="statCardValue">{avgWaitHolding ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Avg Delay (min)</span>
          <span className="statCardSubtitle">Take-off</span>
          <span className="statCardValue">{avgDelayTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Avg Delay (min)</span>
          <span className="statCardSubtitle">Arrival</span>
          <span className="statCardValue">{avgDelayArrival ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Max Delay (min)</span>
          <span className="statCardSubtitle">Take-off</span>
          <span className="statCardValue">{maxDelayTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Max Delay (min)</span>
          <span className="statCardSubtitle">Arrival</span>
          <span className="statCardValue">{maxDelayHolding ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Total</span>
          <span className="statCardSubtitle">Cancellations</span>
          <span className="statCardValue statCardValueCancel">{totalCancelled ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Total</span>
          <span className="statCardSubtitle">Diversions</span>
          <span className="statCardValue statCardValueDivert">{totalDiverted ?? '—'}</span>
        </div>
      </div>
      {/* Configurable Thresholds */}
      <div className="configRow">
        <ConfigBox
          label="MAX WAIT TIME (TAKE-OFF)"
          value={maxWaitConfig.maxWaitTakeoff}
          disabled={isPlaying}
          onApply={(val) => onMaxWaitConfigChange?.({ ...maxWaitConfig, maxWaitTakeoff: val })}
        />
        <ConfigBox
          label="MAX WAIT TIME (HOLDING)"
          value={maxWaitConfig.maxWaitHolding}
          disabled={isPlaying}
          onApply={(val) => onMaxWaitConfigChange?.({ ...maxWaitConfig, maxWaitHolding: val })}
        />
      </div>
    </div>
  );
}