import React, { useState, useEffect } from 'react';
import './Statistics.css'

function ConfigBox({ label, value, onApply }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Sync draft when parent value changes after apply
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
  maxWaitConfig, onMaxWaitConfigChange
}) {
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
      </div>
      {/* Configurable Thresholds */}
      <div className="configRow">
        <ConfigBox
          label="MAX WAIT (TAKE-OFF)"
          value={maxWaitConfig.maxWaitTakeoff}
          onApply={(val) => onMaxWaitConfigChange?.({ ...maxWaitConfig, maxWaitTakeoff: val })}
        />
        <ConfigBox
          label="MAX WAIT (HOLDING)"
          value={maxWaitConfig.maxWaitHolding}
          onApply={(val) => onMaxWaitConfigChange?.({ ...maxWaitConfig, maxWaitHolding: val })}
        />
      </div>
    </div>
  );
}