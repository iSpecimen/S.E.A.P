import { useEffect, useRef } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import "./Cancellations.css";

// Component takes an events array, which defaults to an empty array so it doesn't crash if no events are passed
// Input array example: { id: 1, type: "cancellation", callsign: "CD7363", message: "FLIGHT CD7363 HAS TO BE CANCELLED" }
// The program counts each cancellation/diversion rather than having them separate so the API is simple
// listRef for auto-scrolling
export default function Cancellations({ events = [] }) {
  const listRef = useRef(null);

  const cancellations = events.filter((e) => e.type === "cancellation");
  const diversions = events.filter((e) => e.type === "diversion");

  // Simulation generates events over time via the logger, so the list grows.
  // The effect fires every time events changes and scrolls to the bottom so the user
  // always sees the most recent notification without manual scrolling.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  // Returns appropriate HeroIcon based on event type, with each icon getting a base class.
  const getIcon = (type) => {
    if (type === "cancellation") {
      return <XCircleIcon className="cancellationIcon" />;
    }
    return <ArrowPathIcon className="diversionIcon" />;
  };

  
  return (
    <div className="cancellations">
      {/* Header */}
      <div className="cancellationsHeader">
        <ExclamationTriangleIcon className="cancellationsHeaderIcon" />
        <h2 className="cancellationsTitle">Cancellations / Diversions</h2>
      </div>

      {/* Scrollable event feed
          ref={listRef} connects the element to the auto-scroll effect.
          When no events, shows an empty state message.
          Otherwise, maps over each event and displays the list item
          with type-specific icon and message text. */}
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

      {/* Counters */}
      <div className="cancellationsFooter">
        <div className="cancellationsCounter">
          <span className="cancellationsCounterLabel">Cancellations</span>
          <span className="cancellationsCounterValue cancellationsCounterValueCancel">
            {cancellations.length}
          </span>
        </div>
        <div className="cancellationsCounter">
          <span className="cancellationsCounterLabel">Diversions</span>
          <span className="cancellationsCounterValue cancellationsCounterValueDivert">
            {diversions.length}
          </span>
        </div>
      </div>
    </div>
  );
}