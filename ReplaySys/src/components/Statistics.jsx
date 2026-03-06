import './Statistics.css'

export default function Statistics({
  // Real-time Data Props
  maxInTakeoff, maxInHolding,
  avgWaitTakeoff, avgWaitHolding,
  avgDelayTakeoff, avgDelayArrival,  
  maxWaitConfig = {}, 
  onMaxWaitConfigChange
}) {
  return (
    <div className="statistics">
      {/* Static Header */}
      <div className="statisticsHeader">
        <h2 className="statisticsTitle">Statistics</h2>
      </div>

      
      {/* Real-time Output Grid */}
      <div className="statisticsGrid">
        <div className="statCard">
          <span className="statCardTitle">Max No. of Planes</span>
          <span className="statCardSubtitle">Take-off Queue</span>
          <span className="statCardValue">{maxInTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Max No. of Planes</span>
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
      </div>
      {/* Configurable Thresholds */}
      <div className="configRow">
        <div className="configBox">
          <label>MAX WAIT (TAKE-OFF)</label>
          <input 
            type="number" 
            value={maxWaitConfig.maxWaitTakeoff} 
            onChange={(e) => onMaxWaitConfigChange('maxWaitTakeoff', e.target.value)} 
          />
        </div>
        <div className="configBox">
          <label>MAX WAIT (HOLDING) </label>
          <input 
            type="number" 
            value={maxWaitConfig.maxWaitHolding} 
            onChange={(e) => onMaxWaitConfigChange('maxWaitHolding', e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
}