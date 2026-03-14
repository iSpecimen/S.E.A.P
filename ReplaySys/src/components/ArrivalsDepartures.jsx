import "./ArrivalsDepartures.css";

/**
 * ArrivalsDepartures : Sliding sidebar panel showing planes currently
 * on runways, split into Departures (origin = SEAP) and Arrivals.
 * 
 * Props:
 *   departures: [{ id, callsign, destination, time }]
 *   arrivals:   [{ id, callsign, origin, time }]
 * 
 * Data source: Mapped from activeSim.runways in MainPage.jsx.
 * Each entry represents a plane currently occupying a runway,
 * not the full queue. Times are formatted from _scheduled_time
 * via formatTime() before being passed in.
 */
export default function ArrivalsDepartures({ departures = [], arrivals = [] }) {
    return (
        <div className="arrDep">
            {/* Departures table: planes on runways heading outbound */}
            <div className="arrDepSection">
                <div className="arrDepHeader">
                    <h2 className="arrDepTitle">Departures</h2>
                </div>
                <div className="arrDepTableWrapper">
                    <table className="arrDepTable">
                        <thead>
                            <tr>
                                <th>Call Sign</th>
                                <th>Destination</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departures.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="arrDepEmpty">
                                        No departures this hour.
                                    </td>
                                </tr>
                            )}
                            {departures.map((flight) => (
                                <tr key={flight.id}>
                                    <td>{flight.callsign}</td>
                                    <td>{flight.destination}</td>
                                    <td>{flight.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Arrivals table: planes on runways heading inbound */}
            <div className="arrDepSection">
                <div className="arrDepHeader">
                    <h2 className="arrDepTitle">Arrivals</h2>
                </div>
                <div className="arrDepTableWrapper">
                    <table className="arrDepTable">
                        <thead>
                            <tr>
                                <th>Call-sign</th>
                                <th>Origin</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arrivals.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="arrDepEmpty">
                                        No arrivals this hour.
                                    </td>
                                </tr>
                            )}
                            {arrivals.map((flight) => (
                                <tr key={flight.id}>
                                    <td>{flight.callsign}</td>
                                    <td>{flight.origin}</td>
                                    <td>{flight.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}