import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";

import { startSimulation, changeSimulation, fetchFullState, fetchStatistics } from "../services/api";
//Context creates a shared data layer that both components can read and write to
// SimTab tells context to "switch to tab X" and MainPage reads context to get tab X's data
// createContext makes a container a child component can tap into
//useSim is a custom hook - simpler for child components because they don't have to
// write useContext(SimulationContext) every time (convenience shortcut)
const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

//Stamps out initial state for a new simulation
const createSimState = (config = {}) => ({
    // Backend version (maps to SystemController major.minor)
    major: null,
    minor: null,
    version: null,

    // Status
    loading: false,
    error: null,

    // Full state log fetched in one GET request (86,400 entries)
    stateLog: null,

    // Final stats from GET /api/stats
    statistics: null,

    // What the user entered on the start page
    startConfig: {
        numRunways: config.numRunways ?? 4,
        inboundFlow: config.inboundFlow ?? 10,
        outboundFlow: config.outboundFlow ?? 10,
    },

    maxWaitConfig: { maxWaitTakeoff: 30, maxWaitHolding: 30 },
    committedMaxWaitConfig: { maxWaitTakeoff: 30, maxWaitHolding: 30 },

    // Components read these- these are the per tick fields
    runways: [],
    takeoffQueue: [],
    holdingPattern: [],
    cancellations: [],

    // Timeline
    timelineSec: 0,
    playState: "paused",

    committing: false,

    pendingRunwayChanges: {},
    pendingPlaneChanges: {},
    pendingHPTQChanges: {}
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
        callsign: r.plane?.callsign,
        bearing: r.bearing,
        expectedFreeTime: r.expected_free_time,
        plane: r.plane,
    }));

    const takeoffQueue = (frame.TakeoffQueue?.planes || []).map(mapPlane);
    const holdingPattern = (frame.HoldingQueue?.planes || []).map(mapPlane);

    // Extract cancellation/diversion data
    const cancellations = {
        totalCancelled: frame.cancellations ?? 0,
        totalDiverted: frame.diversions ?? 0,
        events: frame.events ?? [],
    };

    return { runways, takeoffQueue, holdingPattern, cancellations };
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
        isEmergency: plane._emergency,
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
    const playIntervalRef = useRef(null);
    const playbackSpeedRef = useRef(1);
    const activeSim = activeTabID ? simulations[activeTabID] : null;

    // Frontend tab labelling
    // Mapped here (not in SimulationTab) so labels survive page switches.
    // simCounter: increments for each new root simulation (1, 2, 3...)
    const simCounterRef = useRef(0);
    const [labelMap, setLabelMap] = useState({});

    //Called by StartPage when "Start Simulation" is clicked
    //Creates a new simulation by sending the start page data to the backend using POST /api/simulate
    // Then gets the state and stats
    const createSimulation = useCallback(async (config) => {
        const tempTabID = `loading_${Date.now()}`;

        // Increment the frontend sim counter for this new root simulation
        simCounterRef.current += 1;
        const thisSimNumber = simCounterRef.current;

        setSimulations((prev) => ({
            ...prev,
            [tempTabID]: { ...createSimState(config), loading: true },
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
    const duplicateSimulation = useCallback((sourceTabID, newTabID) => {
        setSimulations((prev) => {
            const source = prev[sourceTabID];
            if (!source) return prev;
            return { ...prev, [newTabID]: JSON.parse(JSON.stringify(source)) };
        });
        setActiveTabID(newTabID);

        // Assign a copy label: find the source's simNumber and count existing copies
        setLabelMap((prev) => {
            const sourceInfo = prev[sourceTabID];
            if (!sourceInfo) return prev;
            const rootSimNumber = sourceInfo.simNumber;
            const existingCopies = Object.values(prev).filter(
                (info) => info.simNumber === rootSimNumber && info.copyNumber != null
            ).length;
            return {
                ...prev,
                [newTabID]: { simNumber: rootSimNumber, copyNumber: existingCopies + 1 },
            };
        });
    }, []);

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
        // Clean up the label
        setLabelMap((prev) => {
            const next = { ...prev };
            delete next[tabID];
            return next;
        });
        setActiveTabID((currentID) => {
            if (currentID !== tabID) return currentID;
            const remaining = Object.keys(simulations).filter((k) => k !== tabID);
            return remaining.length > 0 ? remaining[0] : null;
        });
    }, [simulations]);

    // Called when "+ New Simulation" is clicked in the tab bar.
    // Clears activeTabID so App.jsx renders StartPage again.
    const requestNewSimulation = useCallback(() => {
        setActiveTabID(null);
    }, []);


    //Called when the user drags the timeline to a specific position
    // Process:
    /**
     * Confine tick to valid range (0 to 86399)
     * Index into stateLog[tick] to get that second's raw data
     * Run frameToComponentState() top extract runway/ queue data
     * Update tab component fields so components re-render properly
     */
    // We fetch the entire state log output- can scan through timeline in an instant, it's just an array lookup
    const seekToTick = useCallback((tick) => {
        if (!activeTabID) return;
        setSimulations((prev) => {
            const sim = prev[activeTabID];
            if (!sim?.stateLog) {
                return prev;

            }

            const time = Math.max(0, Math.min(tick, sim.stateLog.length - 1));
            //Gets the current component state frame at the specified tick time
            const frame = frameToComponentState(sim.stateLog[time]);

            return {
                ...prev,
                //Updates play head position and overwrites takeooff, runways, and holding pattern
                [activeTabID]: { ...sim, timelineSec: time, ...frame },
            };
        });
    }, [activeTabID]);


    //Only updates active simulation's data 
    //togglePlayPause flips between 'playing' and 'paused'

    const togglePlayPause = useCallback(() => {
        console.log("togglePlayPause called, activeTabID:", activeTabID);
        if (!activeTabID) return;
        setSimulations((prev) => {
            console.log("Current playState:", prev[activeTabID]?.playState);
            return {
                ...prev,
                [activeTabID]: {
                    ...prev[activeTabID],
                    playState:
                        prev[activeTabID].playState === "playing" ? "paused" : "playing",
                },
            };
        });
    }, [activeTabID]);


    const commitRunwayChanges = useCallback(async () => {
        if (!activeTabID) return;
        const sim = simulations[activeTabID];
        if (sim?.major == null || sim?.minor == null) return;

        const runway_pending = sim.pendingRunwayChanges || {};
        const plane_pending = sim.pendingPlaneChanges || {};
        const hptq_pending = sim.pendingHPTQChanges || {};

        // Only return if NOTHING changed
        const hasAny = Object.keys(runway_pending).length > 0
            || Object.keys(plane_pending).length > 0
            || Object.keys(hptq_pending).length > 0;

        if (!hasAny) {
            console.log("No changes detected");
            return;
        }

        // Build runway_config
        const runway_config = [];
        Object.entries(runway_pending).forEach(([runwayID, changes]) => {
            const id = parseInt(runwayID);
            const current = sim.runways[id];
            const mode = changes.mode ?? current.mode;
            const status = changes.status ?? current.status;
            runway_config.push([sim.timelineSec, id + 1, mode, status]);
        });

        // Build plane_config
        const plane_config = [];
        Object.entries(plane_pending).forEach(([callsign, changes]) => {
            if (changes.isEmergency) {
                plane_config.push([sim.timelineSec, callsign]);
            }
        });

        // Build hptq_config
        const hptq_config = [];
        Object.entries(hptq_pending).forEach(([tick, changes]) => {
            const max_hq = changes.maxWaitHolding ?? sim.maxWaitConfig?.maxWaitHolding;
            const max_tq = changes.maxWaitTakeoff ?? sim.maxWaitConfig?.maxWaitTakeoff;
            hptq_config.push([parseInt(tick), max_hq, max_tq]);
        });

        console.log("Sending runway_config:", runway_config);
        console.log("Sending plane_config:", plane_config);
        console.log("Sending hptq_config:", hptq_config);

        setSimulations((prev) => ({
            ...prev,
            [activeTabID]: {...prev[activeTabID], committing: true }
        }))
        try {
            const { major, minor, version } = await changeSimulation({
                major: sim.major,
                minor: sim.minor,
                runway_config,
                plane_config,
                hptq_config,
            });

            const [stateLog, statistics] = await Promise.all([
                fetchFullState(major, minor),
                fetchStatistics(major, minor),
            ]);

            const initialFrame = frameToComponentState(stateLog[0]);
            const tabID = version;

            setSimulations((prev) => ({
                ...prev,
                [activeTabID]: { 
                    ...prev[activeTabID], 
                    committing: false,
                    maxWaitConfig: prev[activeTabID].committedMaxWaitConfig,
                    pendingRunwayChanges: {}, 
                    pendingPlaneChanges: {}, 
                    pendingHPTQChanges: {},
                                },
                [tabID]: {
                    ...prev[activeTabID],
                    major,
                    minor,
                    version,
                    stateLog,
                    statistics,
                    ...initialFrame,
                    timelineSec: 0,
                    playState: "paused",
                    loading: false,
                    error: null,
                    pendingRunwayChanges: {},
                    pendingPlaneChanges: {},
                    pendingHPTQChanges: {},

                    committing: false,

                    maxWaitConfig: prev[activeTabID].maxWaitConfig,
                    committedMaxWaitConfig: prev[activeTabID].maxWaitConfig,
                },
            }));
            setActiveTabID(tabID);

            setLabelMap((prev) => {
                const sourceInfo = prev[activeTabID];
                if (!sourceInfo) return prev;
                const rootSimNumber = sourceInfo.simNumber;
                const existingCopies = Object.values(prev).filter(
                    (info) => info.simNumber === rootSimNumber && info.copyNumber != null
                ).length;
                return {
                    ...prev,
                    [tabID]: { simNumber: rootSimNumber, copyNumber: existingCopies + 1 },
                };
            });
        } catch (err) {
            setSimulations((prev) => ({
                ...prev,
                [activeTabID]: { ...prev[activeTabID], committing: false, error: err.message },
            }));
        }
    }, [activeTabID, simulations]);

    useEffect(() => {
        console.log("Playback useEffect fired, playState:", activeSim?.playState, "hasStateLog:", !!activeSim?.stateLog);

        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
        }

        if (activeSim?.playState !== "playing" || !activeSim?.stateLog) return;

        playIntervalRef.current = setInterval(() => {
            setSimulations((prev) => {
                const sim = prev[activeTabID];
                if (!sim || sim.playState !== "playing" || !sim.stateLog) return prev;

                const nextTick = sim.timelineSec + 1;

                if (nextTick >= sim.stateLog.length) {
                    return { ...prev, [activeTabID]: { ...sim, playState: "paused" } };
                }

                const frame = frameToComponentState(sim.stateLog[nextTick]);
                return {
                    ...prev,
                    [activeTabID]: { ...sim, timelineSec: nextTick, ...frame },
                };
            });
        }, 1000 / playbackSpeedRef.current);

        return () => {
            if (playIntervalRef.current) clearInterval(playIntervalRef.current);
        };
    }, [activeTabID, activeSim?.playState, activeSim?.stateLog]);
    //  Called when: User changes a runway's mode/status via dropdown
    //  BEFORE the simulation runs (or while paused for config branching).
    //
    //  During active replay, runways are read-only (driven by stateLog).
    //
    const updateRunway = useCallback((runwayID, changes) => {
        if (!activeTabID) return;
        setSimulations((prev) => {
            const sim = prev[activeTabID];
            return {
                ...prev,
                [activeTabID]: {
                    ...sim,
                    // Still update runways for visual feedback
                    runways: sim.runways.map((r) =>
                        r.id === runwayID ? { ...r, ...changes } : r
                    ),
                    // Also store the edit separately so it survives seekToTick
                    pendingRunwayChanges: {
                        ...sim.pendingRunwayChanges,
                        [runwayID]: {
                            ...sim.pendingRunwayChanges?.[runwayID],
                            ...changes,
                        },
                    },
                },
            };
        });
    }, [activeTabID]);

    //  Called when: User sets a plane in Holding Pattern/ Takeoff queue to be in an emergency. 
    // 
    const updatePlane = useCallback((planeCallsign, changes) => {
        if (!activeTabID) return;

        setSimulations((prev) => {
            const sim = prev[activeTabID];
            if (!sim) return prev;

            const updateList = (list = []) =>
                list.map((p) =>
                    p.callsign === planeCallsign ? { ...p, ...changes } : p
                );

            return {
                ...prev,
                [activeTabID]: {
                    ...sim,

                    // VISUAL UPDATE
                    takeoffQueue: updateList(sim.takeoffQueue),
                    holdingPattern: updateList(sim.holdingPattern),

                    // PERSIST CHANGE FOR TIMELINE
                    pendingPlaneChanges: {
                        ...sim.pendingPlaneChanges,
                        [planeCallsign]: {
                            ...sim.pendingPlaneChanges?.[planeCallsign],
                            ...changes,
                        },
                    },
                },
            };
        });
    }, [activeTabID]);

    //  Called when: User sets maxhq/tq size at a given tick. 
    // 
    const updateHPTQ = useCallback((changes) => {
        if (!activeTabID) return;

        setSimulations((prev) => {
            const sim = prev[activeTabID];
            if (!sim) return prev;

            return {
                ...prev,
                [activeTabID]: {
                    ...sim,

                    // update UI immediately
                    maxWaitConfig: {
                        ...sim.maxWaitConfig,
                        ...changes
                    },

                    // store pending change so it survives timeline seekToTick
                    pendingHPTQChanges: {
                        ...sim.pendingHPTQChanges,
                        [sim.timelineSec]: {
                            ...sim.pendingHPTQChanges?.[sim.timelineSec],
                            ...changes
                        }
                    }
                }
            };
        });
    }, [activeTabID]);


    const setPlaybackSpeed = useCallback((speed) => {
        playbackSpeedRef.current = speed;
        // If currently playing, restart the interval with new speed
        if (activeSim?.playState === "playing") {
            // Toggle off and on to restart the interval with new speed
            setSimulations((prev) => ({
                ...prev,
                [activeTabID]: { ...prev[activeTabID], playState: "paused" },
            }));
            setTimeout(() => {
                setSimulations((prev) => ({
                    ...prev,
                    [activeTabID]: { ...prev[activeTabID], playState: "playing" },
                }));
            }, 50);
        }
    }, [activeTabID, activeSim?.playState]);


    // WHAT CAN BE ACCESSED BY WHAT AT A PARTICULAR TIME?
    //  State:
    //    simulations  — the full dictionary of all tabs
    //    activeTabID  — which tab is currently selected (e.g. "1.0")
    //    activeSim    — shortcut: the currently selected tab's state object
    //    labelMap     — tab labelling: tabID → { simNumber, copyNumber }
    //
    //  Actions:
    //    createSimulation(config)              — Start Page calls this
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
                // State
                simulations,
                activeTabID,
                activeSim,
                labelMap,

                // Actions
                createSimulation,
                duplicateSimulation,
                switchTab,
                removeSimulation,
                requestNewSimulation,
                togglePlayPause,
                seekToTick,
                updateRunway,
                updatePlane,
                updateHPTQ,
                commitRunwayChanges,
                setPlaybackSpeed,
                formatSecondsToTime,
                committing: activeSim?.committing ?? false,
            }}
        >
            {children}
        </SimulationContext.Provider>
    );



}