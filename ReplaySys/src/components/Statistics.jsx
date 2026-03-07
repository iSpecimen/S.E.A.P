import './Statistics.css'

export default function Statistics({
  maxInTakeoff, maxInHolding,
  maxWaitTakeoff, maxWaitHolding,
  avgDelayTakeoff, avgDelayArrival
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
          <span className="statCardTitle">Max Wait Time (min)</span>
          <span className="statCardSubtitle">Take-off Queue</span>
          <span className="statCardValue">{maxWaitTakeoff ?? '—'}</span>
        </div>
        <div className="statCard">
          <span className="statCardTitle">Max Wait Time (min)</span>
          <span className="statCardSubtitle">Holding Pattern</span>
          <span className="statCardValue">{maxWaitHolding ?? '—'}</span>
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
    </div>
  );
}