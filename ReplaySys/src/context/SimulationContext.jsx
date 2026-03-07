import React, { createContext, useContext, useCallback, useState, useEffect } from "react";


//Context creates a shared data layer that both components can read and write to
// SimTab tells context to "switch to tab X" and MainPage reads context to get tab X's data
// createContext makes a container a child component can tap into
//useSim is a custom hook - simpler for child components because they don't have to
// write useContext(SimulationContext) every time (convenience shortcut)
const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

//Stamps out initial state for a new simulation
const createSimState = (config = {}) => ({
    //Runways dynamically generated from user input
    runways: config.runways || [{ id: 1, name: "Runway 1", mode: "Mixed", status: "AVAILABLE" },
    { id: 2, name: "Runway 2", mode: "Mixed", status: "AVAILABLE" },

    ],

    //Queues - start empty, then they are later populated by the backend
    takeoffQueue: config.takeoffQueue || [],
    holdingPattern: config.holdingPattern || [],

    //Output panels
    cancellations: config.cancellations || [],
    statistics: config.statistics || {},


    //Timeline 
    timelineSec: 0,
    playState: "paused", //"paused"| "playing"

}

);

//Maps one tick's Logger class output to a component-friendly prop
// Allows the components to easily access and render the information
function frameToComponentState(frame) {

    if (!frame) {
        return {};
    }
    const runways = (frame.runways || []).map((r, index) => ({
        id: index,
        name: `Runway ${index + 1}`,
        mode: r.mode,
        status: r.status,
        callsign: r.callsigns,
        bearing: r.bearing,
        expectedFreeTime: r.expected_free_time,
    }));

    // Takeoff Queue 
    // Logger: frame.TakeoffQueue.planes to array of plane dictionaries
    const takeoffQueue = (frame.TakeoffQueue?.planes || []).map(mapPlane);


    //Holding Pattern
    // Maps the frame with the holding pattern planes to an array of plane dictionaries
    const holdingPattern = (frame.HoldingQueue?.planes || []).map(mapPlane);
    console.log("Runway statuses:", frame.runways?.map(r => ({ status: r.status, mode: r.mode })));

    return { runways, takeoffQueue, holdingPattern }
}

function formatSecondsToTime(totalSeconds) {
  if (totalSeconds == null) return "--:--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


//Maps a single plane dictionary from the logger into component-friendly props
function mapPlane(plane) {
    return {
        callsign: plane.callsign,
        operator: plane.operator,
        origin: plane.origin,
        destination: plane.destination,
        scheduledTime: plane._scheduled_time,
        time: formatSecondsToTime(plane._scheduled_time),
        altitude: plane._altitude,
        fuel: plane._fuel_seconds,
        speed: plane._ground_speed,
        delayed: plane._delayed,
        emergency: plane._emergency,
    };
}


//Wrapper component that holds all the simulation data
//'simulations' is a dictionary, where each key is a tab ID, each value is that tab's full sim state
// 'activeTabID' tracks which tab the user's looking at
// 'activeSim' look's up the current tab's data from the dictionary
// Switching tabs is very easy because all the data's in one place
export function SimulationProvider({ children }) {
    const [simulations, setSimulations] = useState({});
    const [activeTabID, setActiveTabID] = useState(null);

    const activeSim = activeTabID ? simulations[activeTabID] : null;

    //Called by SimulationTab when "+ New Simulation" is clicked
    const createSimulation = useCallback(async (tabID, config) => {
        setSimulations((prev) => ({
            ...prev,
            [tabID]: createSimState(config),


        }));
        setActiveTabID(tempTabID);

        try {
            // POST config : backend runs all 86,400 ticks
            const { major, minor, version } = await startSimulation({
                numRunways: config.numRunways ?? 4,
                inboundFlow: config.inboundFlow ?? 10,
                outboundFlow: config.outboundFlow ?? 10,
            });

            // Fetch full state log + stats in parallel
            const [stateLog, statistics] = await Promise.all([
                fetchFullState(major, minor),
                fetchStatistics(major, minor),
            ]);
            

            // Get initial frame (tick 0)
            const initialFrame = frameToComponentState(stateLog[0]);
            const tabID = version; // "1.0", "2.0", etc.

            setSimulations((prev) => {
                const next = { ...prev };
                delete next[tempTabID];
                next[tabID] = {
                    ...createSimState(config),
                    major,
                    minor,
                    version,
                    loading: false,
                    stateLog,
                    statistics,
                    ...initialFrame,
                    timelineSec: 0,
                    playState: "paused",
                };
                return next;
            });
            setActiveTabID(tabID);

            // Assign frontend label for this root simulation
            setLabelMap((prev) => ({
                ...prev,
                [tabID]: { simNumber: thisSimNumber, copyNumber: null },
            }));
            console.log("STATE LOG:", stateLog);
            console.log("Initial frame:", stateLog[0]);
            console.log("Mapped frame:", initialFrame);
        } catch (err) {
            setSimulations((prev) => ({
                ...prev,
                [tempTabID]: {
                    ...prev[tempTabID],
                    loading: false,
                    error: err.message,
                },
            }));
        }
    }, []);

    //Called when copy config clicked
    //Deep copies the simulation's entire state using JSON.parse(JSON.stringify(...))
    //Copy starts identical to the original, changes only affect the copy
    //Allows you to test alternative runway settings without losing the original
    const duplicateSimulation = useCallback(
        (sourceTabID, newTabID) => {
            setSimulations((prev) => {
                const source = prev[sourceTabID];
                if (!source) return prev;
                return {
                    ...prev,

                    //Deep copy- changes to the copy don't affect the original
                    [newTabID]: JSON.parse(JSON.stringify(source)),

                };
            });
            setActiveTabID(newTabID);
        },
        []
    );

    // Called when switching tabs
    const switchTab = useCallback((tabID) => {
        setActiveTabID(tabID);
    }, []);

    // Called when closing a tab
    const removeSimulation = useCallback((tabID) => {
        setSimulations((prev) => {
            const next = { ...prev };
            delete next[tabID];
            return next;
        });
    }, []);

    //Only updates active simulation's data 
    //togglePlayPause flips between 'playing' and 'paused'

    const togglePlayPause = useCallback(() => {
        if (!activeTabID) return;
        setSimulations((prev) => ({
            ...prev,
            //Only modifies those with activeTabID, other tabs left untouched
            [activeTabID]: {
                ...prev[activeTabID],
                playState: prev[activeTabID].playState === "playing" ? "paused" : "playing",

            },
        }));
    }, [activeTabID]);

    //Changes a specific runway's mode/status when user picks from RunwayCard dropdowns

    const updateRunway = useCallback((runwayID, changes) => {
        if (!activeTabID) return;
        setSimulations((prev) => ({
            ...prev,
            [activeTabID]: {
                ...prev[activeTabID],
                runways: prev[activeTabID].runways.map((r) =>
                    r.id === runwayID ? { ...r, ...changes } : r
                ),
            },
        }));
    }, [activeTabID]);

    // WHAT CAN BE ACCESSED BY WHAT AT A PARTICULAR TIME?
    //  State:
    //    simulations  — the full dictionary of all tabs
    //    activeTabID  — which tab is currently selected (e.g. "1.0")
    //    activeSim    — shortcut: the currently selected tab's state object
    //    labelMap     — tab labelling: tabID → { simNumber, copyNumber }
    //
    //  Actions:
    //    createSimulation(config)              — Start Page calls this when it starts
    //    duplicateSimulation(sourceID, newID)  — Copy Config calls this
    //    switchTab(tabID)                      — SimulationTab calls this
    //    removeSimulation(tabID)               — Close tab button calls this
    //    requestNewSimulation()                — "+ New Simulation" button calls this
    //    togglePlayPause()                     — Timeline play button calls this
    //    seekToTick(tick)                      — Timeline slider calls this
    //    updateRunway(runwayID, changes)       — RunwayCard dropdown calls this
    //
    return (
        <SimulationContext.Provider
            value={{
                simulations, //Full dictionary
                activeTabID, //current tab ID
                activeSim, //current tab's data (most used)
                createSimulation, //SimulationTab calls this
                duplicateSimulation,
                switchTab,
                removeSimulation,
                togglePlayPause,  //Timeline calls this
                updateRunway, //RunwayCard calls this

            }}
        >{children}</SimulationContext.Provider>
    );

}

