import "./ArrivalsDepartures.css";

// departures: [{ id: 1, callsign: "MX123", destination: "LONDON", time: "12:45" }]
// arrivals:   [{ id: 1, callsign: "CS261", origin: "LISBON", time: "06:50" }]
export default function ArrivalsDepartures({ departures = [], arrivals = [] }) {
    return (
        <div className="arrDep">
            {/* Departures */}
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
                            {/**Flight ID gives react a stable identifier for simulation updates */}
                            {departures.map((flight) => (
                                <tr key={flight.id}>
                                    <td>{flight.callsign}</td>
                                    <td>{flight.destination}</td>
                                    <td>{flight.time}</td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div >
            </div >

            {/* Arrivals */}
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


        </div >

    );
}