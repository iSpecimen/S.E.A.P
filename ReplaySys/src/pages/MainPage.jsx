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
    //Reading from context
    const { activeSim, seekToTick } = useSimulation();

    // Arrivals/Departures hook 
    const [showArrDep, setShowArrDep] = useState(false);

    //ERROR HANDLING
    if (activeSim?.loading) return <div className="loading">Running simulation...</div>;
    if (activeSim?.error) return <div className="error">{activeSim.error}</div>;
    if (!activeSim?.stateLog) return <div>Create a simulation to begin.</div>;

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
                    <TakeoffQueue flights={takeoffQueue} />
                    <HoldingPattern flights={holdingPattern} />
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
                                callSign={rw.callsign || "N/A"}
                                initialMode={rw.mode}
                                initialStatus={rw.status}
                            />))}
                    </div>
                    {/*Every time it ticks (or the user drags the slider), it calls onTimeChange(newSecond).
                    We pass seekToTick as that callback.
                    seekToTick indexes into stateLog[newSecond] and
                    updates runways/takeoffQueue/holdingPattern,
                    which causes all the components above to re-render with the correct data for that second. */}
                    <div className="timeline">
                        <Timeline
                            onTimeChange={seekToTick}
                            onPlayStateChange={(playing) => console.log("Playing:", playing)}
                        />

                    </div>
                </main>

                {/*Right Side*/}
                <section className="rightSidebar">
                    <div className="Cancellations">
                        <Cancellations events={activeSim?.cancellations || []}></Cancellations>

                    </div>
                    <div className="Statistics">
                        <div className="Statistics">
                            <Statistics
                                maxInTakeoff={statistics.max_tqueue_size}
                                maxInHolding={statistics.max_hqueue_size}
                                maxWaitTakeoff={statistics.max_tqueue_wait}
                                maxWaitHolding={statistics.max_hqueue_wait}
                                avgDelayTakeoff={statistics.avg_tqueue_delay}
                                avgDelayArrival={statistics.avg_hqueue_delay}
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
                            departures={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin === "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    destination: p.destination,
                                    time: p.time,
                                }))}
                            arrivals={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin !== "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    origin: p.origin,
                                    time: p.time,
                                }))}
                        />
                    </div>
                </aside>
            </div>


        </div>
    );

};
export default MainPage;
