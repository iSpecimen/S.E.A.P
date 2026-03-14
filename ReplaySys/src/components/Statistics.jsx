import React, { useState, useEffect } from 'react';
import './Statistics.css';
import { useSimulation } from '../context/SimulationContext';

/**
 * ConfigBox: Allows the user to configure maximum queue wait time.
 * Displays a value with an edit button (✎). Clicking it switches
 * to a number input; clicking apply (✔) commits the change.
 *
 * Props:
 *   label: Display label (e.g. "MAX WAIT TIME (TAKE-OFF)")
 *   value: Current numeric value from parent
 *   onApply: Fired when user commits changes
 *   disabled: When true (during playback), the edit button is greyed out.
 *             If already editing when disabled changes, the apply button
 *             remains active so the user can finish their edit.
 */
function ConfigBox({ label, value, onApply, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Sync draft with parent value when it changes (e.g. after commit)
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

/**
 * Statistics – Right sidebar panel displaying aggregated simulation
 * metrics and configurable queue thresholds.
 *
 * Props (all from GET /api/stats via activeSim.statistics):
 *   maxInTakeoff
 *   maxInHolding
 *   avgWaitTakeoff:  Average wait time in takeoff queue (minutes)
 *   avgWaitHolding:  Average wait time in holding pattern (minutes)
 *   avgDelayTakeoff: Average departure delay (minutes)
 *   avgDelayArrival: Average arrival delay (minutes)
 *   maxDelayTakeoff: Worst-case departure delay (minutes)
 *   maxDelayHolding: Worst-case arrival delay (minutes)
 *
 * Props (from frameToComponentState per-tick data):
 *   totalCancelled:  Cumulative cancellations at current tick
 *   totalDiverted:   Cumulative diversions at current tick
 *
 * Props (configurable thresholds):
 *   maxWaitConfig:          { maxWaitTakeoff, maxWaitHolding } — current values
 *   onMaxWaitConfigChange:  Callback to update thresholds via updateHPTQ in context.
 *                           Changes are stored in pendingHPTQChanges and sent to
 *                           the backend on commit.
 *
 * The stat grid uses a 2-column layout of cards. Cancellation/diversion
 * cards are colour-coded (red/amber). ConfigBox fields are disabled
 * during playback to prevent mid-simulation edits.
 */
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

      {/* 2-column grid of stat cards — values from backend statistics endpoint */}
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

        {/* Per-tick totals from stateLog — colour-coded for quick scanning */}
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

      {/* Editable thresholds — changes stored in pendingHPTQChanges until committed */}
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