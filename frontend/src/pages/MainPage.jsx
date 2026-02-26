import React, { useState } from "react";
import "./MainPage.css";
import Timeline from "../components/Timeline";

import Cancellations from "../components/Cancellations";
import ArrivalsDepartures from "../components/ArrivalsDepartures";
import RunwayCard from "../components/RunwayCard";
import TakeoffQueue from "../components/TakeoffQueue";
import HoldingPattern from "../components/HoldingPattern";
import Statistics from "../components/Statistics";
import SimulationTab from "../components/SimulationTab";
import { useSimulation } from "../context/SimulationContext";

// Declaring functional component const
const MainPage = () => {
    const [takeoffFlights, setTakeoffFlights] = useState([
        { callsign: 'MX123', destination: 'LONDON', time: '12:45' },
        { callsign: 'UA990', destination: 'NEW YORK', time: '13:10' },
        { callsign: 'AF442', destination: 'PARIS', time: '13:25' },
        { callsign: 'LH101', destination: 'BERLIN', time: '13:40' },
    ]);

    // Mock data for the Holding Pattern
    const [holdingFlights, setHoldingFlights] = useState([
        { callsign: 'CS261', origin: 'LISBON', time: '06:50' },
        { callsign: 'QA332', origin: 'DOHA', time: '07:15' },
    ]);

    // Arrivals/Departures hook 
    const [showArrDep, setShowArrDep] = useState(false);


    const { activeSim, togglePlayPause } = useSimulation();

    // Fallbacks while no simulation is loaded
    const runways = activeSim?.runways || [];
    const takeoffQueue = activeSim?.takeoffQueue || [];
    const holdingPattern = activeSim?.holdingPattern || [];
    const cancellations = activeSim?.cancellations || [];
    const statistics = activeSim?.statistics || {};
    return (
        <div className="mainPage">
            {/*Tab Bar - Simulation Tab Component */}
            <header className="tabBar">
                <SimulationTab
                    onTabChange={(id) => console.log("Switched to tab:", id)}
                    onNewSimulation={() => console.log("New simulation requested")}
                    onCloseTab={(id) => console.log("Closed tab:", id)}
                />

            </header>
            {/*Main Content*/}
            <div className="mainBody">
                {/*Left Side*/}
                <div className="leftSidebar">
                    <TakeoffQueue flights={takeoffFlights} />
                    <HoldingPattern flights={holdingFlights} />
                </div>


                {/*Centre Card*/}
                <main className="centre">
                    <div className="runwayGrid">
                        {/*Runways render dynamically with .map(), so each tab has its own runway config*/}
                        {runways.map((rw) => (
                            <RunwayCard
                                key={rw.id}
                                runwayID={rw.id}
                                runwayName={rw.name}
                                initialMode={rw.mode}
                                initialStatus={rw.status}
                            />))}
                    </div>
                    <div className="timeline">
                        <Timeline
                            onTimeChange={(sec) => console.log("Time:", sec)}
                            onPlayStateChange={(playing) => console.log("Playing:", playing)}
                        />

                    </div>
                </main>

                {/*Right Side*/}
                <section className="rightSidebar">
                    <div className="Cancellations">
                        <Cancellations events={[
                            { id: 1, type: "diversion", callsign: "AB123", message: "FLIGHT AB123 HAS TO BE DIVERTED TO..." },
                            { id: 2, type: "cancellation", callsign: "CD7363", message: "FLIGHT CD7363 HAS TO BE CANCELLED" },
                        ]} />

                    </div>
                    <div className="Statistics">
                        <div className="Statistics">
                            <Statistics
                                maxInTakeoff={38}
                                maxInHolding={44}
                                maxWaitTakeoff={40}
                                maxWaitHolding={10}
                                avgDelayTakeoff={null}
                                avgDelayArrival={null}
                            />
                        </div>
                    </div>
                </section>

                <button className="arrDepToggle" onClick={() => setShowArrDep(!showArrDep)}>
                    {showArrDep ? "▶" : "◀"}

                </button>
                <aside className={`arrDepSidebar ${showArrDep ? "open" : ""}`}>
                    <div className="arrivalsDepartures">
                        <ArrivalsDepartures
                            departures={[
                                { id: 1, callsign: "MX123", destination: "LONDON", time: "12:45" },
                            ]}
                            arrivals={[
                                { id: 1, callsign: "CS261", origin: "LISBON", time: "06:50" },
                            ]}
                        />

                    </div>
                </aside>
            </div>


        </div>
    );

};
export default MainPage;
