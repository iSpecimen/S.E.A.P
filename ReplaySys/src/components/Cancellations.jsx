import { useEffect, useRef } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import "./Cancellations.css";

/**
 * Cancellations: Right sidebar panel displaying a live feed of
 * cancellation and diversion events, with running totals as the timeline moves forward.
 *
 * Props:
 *   events: Array of the last 5 events from the backend logger.
 *           Structure: { id, type: "cancellation"/"diversion", callsign, message }
 *   totalCancelled: Cumulative cancellation count at the current tick.
 *   totalDiverted:  Cumulative diversion count at the current tick.
 *
 * Data source: Extracted per-tick from the stateLog via
 * frameToComponentState() in SimulationContext.jsx.
 *
 * The event list auto-scrolls to the latest entry as new events
 * happen during playback. Icons distinguish cancellations (XCircle)
 * from diversions (ArrowPath). Footer counters show backend totals
 * rather than counting the visible events, since the list only
 * holds the most recent 5.
 */
export default function Cancellations({ events = [], totalCancelled = 0, totalDiverted = 0 }) {
  const listRef = useRef(null);

  // Auto-scroll to newest event whenever the list updates
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  // Returns the appropriate HeroIcon based on event type
  const getIcon = (type) => {
    if (type === "cancellation") {
      return <XCircleIcon className="cancellationIcon" />;
    }
    return <ArrowPathIcon className="diversionIcon" />;
  };

  return (
    <div className="cancellations">
      {/* Header with warning icon */}
      <div className="cancellationsHeader">
        <ExclamationTriangleIcon className="cancellationsHeaderIcon" />
        <h2 className="cancellationsTitle">Cancellations / Diversions</h2>
      </div>

      {/* Scrollable event feed, which shows last 5 events from backend */}
      <ul className="cancellationsList" ref={listRef}>
        {events.length === 0 && (
          <li className="cancellationsEmpty">No cancellations or diversions.</li>
        )}
        {events.map((event) => (
          <li key={event.id} className="cancellationsItem">
            {getIcon(event.type)}
            <span className="cancellationsMessage">{event.message}</span>
          </li>
        ))}
      </ul>

      {/* Footer: cumulative totals from the backend, not from events array */}
      <div className="cancellationsFooter">
        <div className="cancellationsCounter">
          <span className="cancellationsCounterLabel">Cancellations</span>
          <span className="cancellationsCounterValue cancellationsCounterValueCancel">
            {totalCancelled}
          </span>
        </div>
        <div className="cancellationsCounter">
          <span className="cancellationsCounterLabel">Diversions</span>
          <span className="cancellationsCounterValue cancellationsCounterValueDivert">
            {totalDiverted}
          </span>
        </div>
      </div>
    </div>
  );
}