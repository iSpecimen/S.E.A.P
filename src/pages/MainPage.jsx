import React, { useState } from "react";
import "./MainPage.css";
import Timeline from "../components/Timeline";

import Cancellations from "../components/Cancellations";
import ArrivalsDepartures from "../components/ArrivalsDepartures";
import RunwayCard from "../components/RunwayCard";
import TakeoffQueue from "../components/TakeoffQueue";
import HoldingPattern from "../components/HoldingPattern";

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
    return (
        <div className="mainPage">
            {/*Tab Bar - Simulation Tab Component */}
            <header className="tabBar">

            </header>
            {/*Main Content*/}
            <div className="mainBody">
                {/*Left Side*/}
               <div className= "leftSidebar">         
                    <TakeoffQueue flights={takeoffFlights} />
                    <HoldingPattern flights={holdingFlights} />
                </div>

              
                {/*Centre Card*/}
                <main className="centre">
                    <div className="runwayGrid">
                        {/* mock up */}
                        <RunwayCard runwayName="Runway 1" initialMode="Take-off" fuelLevel={100} hoverInfo="CALL-SIGN:124 ORIGIN: BKK" />
                        <RunwayCard runwayName="Runway 2" initialMode="Mixed" />
                        <RunwayCard runwayName="Runway 3" initialMode="Landing" />
                        <RunwayCard runwayName="Runway 4" initialMode="Mixed" />
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