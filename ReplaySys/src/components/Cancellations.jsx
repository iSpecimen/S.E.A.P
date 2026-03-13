import { useEffect, useRef } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import "./Cancellations.css";
import { useSimulation } from "../context/SimulationContext";

// Component takes an events array, which defaults to an empty array so it doesn't crash if no events are passed
// Input array example: { id: 1, type: "cancellation", callsign: "CD7363", message: "FLIGHT CD7363 HAS TO BE CANCELLED" }
// The program counts each cancellation/diversion rather than having them separate so the API is simple
// listRef for auto-scrolling
export default function Cancellations({ events = [], totalCancelled = 0, totalDiverted = 0 }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  const getIcon = (type) => {
    if (type === "cancellation") {
      return <XCircleIcon className="cancellationIcon" />;
    }
    return <ArrowPathIcon className="diversionIcon" />;
  };

  return (
    <div className="cancellations">
      <div className="cancellationsHeader">
        <ExclamationTriangleIcon className="cancellationsHeaderIcon" />
        <h2 className="cancellationsTitle">Cancellations / Diversions</h2>
      </div>

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

      {/* Use backend totals instead of counting from events array */}
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