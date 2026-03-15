import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";
import { startSimulation, changeSimulation, fetchFullState, fetchStatistics } from "../services/api";

/**
 * SimulationContext – Central state management for the entire application.
 * Acts as the single hub that every component reads from and writes to.
 *
 * Architecture:
 *   All simulation state lives in one dictionary (`simulations`), keyed by
 *   tab ID (e.g. "1.0", "1.1"). This means switching tabs, running multiple
 *   simulations side-by-side, or branching configs is just a dictionary lookup;
 *   no re-fetching needed
 *
 * Data flow:
 *   1. User starts a sim: createSimulation() POSTs config to backend
 *   2. Backend runs all 86,400 ticks: returns version ID
 *   3. Frontend fetches full stateLog + statistics in parallel
 *   4. stateLog[tick] is indexed directly for O(1) access
 *   5. frameToComponentState() maps each tick's raw JSON into component-friendly props
 *
 * Pending changes pattern:
 *   When the user pauses and edits runway config / emergency flags / queue thresholds,
 *   changes are stored in separate `pendingChanges` objects that seekToTick() never
 *   touches. This prevents the timeline from overwriting user edits. On commit,
 *   only the diffs are sent to the backend, and a new simulation opens in a fresh tab.
 *
 * Provider function exposes (can be used in other components):
 *   State:  simulations, activeTabID, activeSim, labelMap, committing
 *   Actions: createSimulation, duplicateSimulation, switchTab, removeSimulation,
 *            requestNewSimulation, togglePlayPause, seekToTick, updateRunway,
 *            updatePlane, updateHPTQ, commitRunwayChanges, setPlaybackSpeed,
 *            formatSecondsToTime
 */
const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

/**
 * createSimState – Function that generates the initial state
 * for a new simulation tab. Every field a component might read is
 * initialised here so there are no undefined access errors on first render.
 */
const createSimState = (config = {}) => ({
    // Backend version (maps to SystemController major.minor)
    major: null,
    minor: null,
    version: null,

    
    loading: false,
    error: null,
    committing: false,

    // Full state log fetched in one GET request (86,400 entries)
    stateLog: null,

    // Final aggregated stats from GET /api/stats
    statistics: null,

    // What the user entered on the start page
    startConfig: {
        numRunways: config.numRunways ?? 4,
        inboundFlow: config.inboundFlow ?? 10,
        outboundFlow: config.outboundFlow ?? 10,
    },

    // Configurable queue thresholds (editable while paused)
    maxWaitConfig: { maxWaitTakeoff: 30, maxWaitHolding: 30 },
    committedMaxWaitConfig: { maxWaitTakeoff: 30, maxWaitHolding: 30 },

    // Per-tick component state (overwritten by frameToComponentState each tick)
    runways: [],
    takeoffQueue: [],
    holdingPattern: [],
    cancellations: [],

    // Timeline
    timelineSec: 0,
    playState: "paused",

    // Pending user edits: stored separately so seekToTick can't overwrite them
    pendingRunwayChanges: {},
    pendingPlaneChanges: {},
    pendingHPTQChanges: {},
});

/**
 * frameToComponentState – Maps one tick's raw Logger JSON output into
 * component-friendly props. Called every time the timeline advances or
 * the user moves timeline to a new position.
 *
 * Input: A single frame from stateLog[tick]
 * Output: { runways, takeoffQueue, holdingPattern, cancellations }
 */
function frameToComponentState(frame) {
    if (!frame) return {};

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

    // Cancellation/diversion data: cumulative totals + last 5 events
    const cancellations = {
        totalCancelled: frame.cancellations ?? 0,
        totalDiverted: frame.diversions ?? 0,
        events: frame.events ?? [],
    };

    return { runways, takeoffQueue, holdingPattern, cancellations };
}

/** Format seconds since midnight as HH:MM for display in queues and tables */
function formatSecondsToTime(totalSeconds) {
    if (totalSeconds == null) return "--:--";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * mapPlane:  Maps a single plane dictionary from the backend Logger
 * into component-usable props. Renames private
 * fields (e.g. _fuel_seconds to fuel) and formats scheduled time.
 */
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

/**
 * SimulationProvider: Holds all the simulation data and exposes it via React context
 *
 * 'simulations' is a dictionary where each key is a tab ID and each
 * value is that tab's full sim state. 'activeTabID' tracks which tab
 * the user is viewing. 'activeSim' is a convenience shortcut to the
 * current tab's data.
 */
export function SimulationProvider({ children }) {
    const [simulations, setSimulations] = useState({});
    const [activeTabID, setActiveTabID] = useState(null);
    const playIntervalRef = useRef(null);
    const playbackSpeedRef = useRef(1);
    const activeSim = activeTabID ? simulations[activeTabID] : null;

    // Frontend tab labelling:  mapped here (not in SimulationTab) so labels
    // survive page switches. simCounter increments for each new root simulation.
    const simCounterRef = useRef(0);
    const [labelMap, setLabelMap] = useState({});

    // CREATE SIMULATION 
    // Called by StartPage when "Start Simulation" is clicked.
    // POSTs config to backend, fetches full stateLog + stats, opens new tab.
    const createSimulation = useCallback(async (config) => {
        const tempTabID = `loading_${Date.now()}`;
        simCounterRef.current += 1;
        const thisSimNumber = simCounterRef.current;

        setSimulations((prev) => ({
            ...prev,
            [tempTabID]: { ...createSimState(config), loading: true },
        }));
        setActiveTabID(tempTabID);

        try {
            const { major, minor, version } = await startSimulation({
                numRunways: config.numRunways ?? 4,
                inboundFlow: config.inboundFlow ?? 10,
                outboundFlow: config.outboundFlow ?? 10,
            });

            // Fetch stateLog and statistics in parallel for speed
            const [stateLog, statistics] = await Promise.all([
                fetchFullState(major, minor),
                fetchStatistics(major, minor),
            ]);

            const initialFrame = frameToComponentState(stateLog[0]);
            const tabID = version;

            setSimulations((prev) => {
                const next = { ...prev };
                delete next[tempTabID];
                next[tabID] = {
                    ...createSimState(config),
                    major, minor, version,
                    loading: false,
                    stateLog, statistics,
                    ...initialFrame,
                    timelineSec: 0,
                    playState: "paused",
                };
                return next;
            });
            setActiveTabID(tabID);

            setLabelMap((prev) => ({
                ...prev,
                [tabID]: { simNumber: thisSimNumber, copyNumber: null },
            }));
        } catch (err) {
            setSimulations((prev) => ({
                ...prev,
                [tempTabID]: { ...prev[tempTabID], loading: false, error: err.message },
            }));
        }
    }, []);

    // DUPLICATE SIMULATION 
    // Deep-copies a simulation's entire state via JSON.parse(JSON.stringify(...)).
    // Copy starts identical to the original, so changes only affect the copy.
    const duplicateSimulation = useCallback((sourceTabID, newTabID) => {
        setSimulations((prev) => {
            const source = prev[sourceTabID];
            if (!source) return prev;
            return { ...prev, [newTabID]: JSON.parse(JSON.stringify(source)) };
        });
        setActiveTabID(newTabID);

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

    // TAB MANAGEMENT 

    const switchTab = useCallback((tabID) => {
        setActiveTabID(tabID);
    }, []);

    const removeSimulation = useCallback((tabID) => {
        setSimulations((prev) => {
            const next = { ...prev };
            delete next[tabID];
            return next;
        });
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

    // Clears activeTabID, then App.jsx renders StartPage for new config input
    const requestNewSimulation = useCallback(() => {
        setActiveTabID(null);
    }, []);

    // TIMELINE CONTROLS

    // seekToTick: O(1) array lookup into stateLog
    // Overwrites per-tick component state but never touches pendingChanges.
    const seekToTick = useCallback((tick) => {
        if (!activeTabID) return;
        setSimulations((prev) => {
            const sim = prev[activeTabID];
            if (!sim?.stateLog) return prev;

            const time = Math.max(0, Math.min(tick, sim.stateLog.length - 1));
            const frame = frameToComponentState(sim.stateLog[time]);

            return {
                ...prev,
                [activeTabID]: { ...sim, timelineSec: time, ...frame },
            };
        });
    }, [activeTabID]);

    // togglePlayPause: flips between 'playing' and 'paused'
    const togglePlayPause = useCallback(() => {
        if (!activeTabID) return;
        setSimulations((prev) => ({
            ...prev,
            [activeTabID]: {
                ...prev[activeTabID],
                playState: prev[activeTabID].playState === "playing" ? "paused" : "playing",
            },
        }));
    }, [activeTabID]);

    // COMMIT CHANGES 
    // Collects all pending edits (runways, emergencies, queue thresholds),
    // sends only the changes to the backend, and opens the new simulation
    // in a fresh tab — preserving the original for comparison.
    const commitRunwayChanges = useCallback(async () => {
        if (!activeTabID) return;
        const sim = simulations[activeTabID];
        if (sim?.major == null || sim?.minor == null) return;

        const runway_pending = sim.pendingRunwayChanges || {};
        const plane_pending = sim.pendingPlaneChanges || {};
        const hptq_pending = sim.pendingHPTQChanges || {};

        // Only proceed if at least one category has changes
        const hasAny = Object.keys(runway_pending).length > 0
            || Object.keys(plane_pending).length > 0
            || Object.keys(hptq_pending).length > 0;

        if (!hasAny) {
            console.log("No changes detected");
            return;
        }

        // Build runway_config: [tick, runwayNumber, mode, status]
        const runway_config = [];
        Object.entries(runway_pending).forEach(([runwayID, changes]) => {
            const id = parseInt(runwayID);
            const current = sim.runways[id];
            runway_config.push([
                sim.timelineSec,
                id + 1,
                changes.mode ?? current.mode,
                changes.status ?? current.status,
            ]);
        });

        // Build plane_config: [tick, callsign] for emergency declarations
        const plane_config = [];
        Object.entries(plane_pending).forEach(([callsign, changes]) => {
            if (changes.isEmergency) {
                plane_config.push([sim.timelineSec, callsign]);
            }
        });

        // Build hptq_config: [tick, maxHolding, maxTakeoff] for threshold changes
        const hptq_config = [];
        Object.entries(hptq_pending).forEach(([tick, changes]) => {
            hptq_config.push([
                parseInt(tick),
                changes.maxWaitHolding ?? sim.maxWaitConfig?.maxWaitHolding,
                changes.maxWaitTakeoff ?? sim.maxWaitConfig?.maxWaitTakeoff,
            ]);
        });

        // Set committing flag
        setSimulations((prev) => ({
            ...prev,
            [activeTabID]: { ...prev[activeTabID], committing: true },
        }));

        try {
            const { major, minor, version } = await changeSimulation({
                major: sim.major,
                minor: sim.minor,
                runway_config, plane_config, hptq_config,
            });

            const [stateLog, statistics] = await Promise.all([
                fetchFullState(major, minor),
                fetchStatistics(major, minor),
            ]);

            const initialFrame = frameToComponentState(stateLog[0]);
            const tabID = version;

            setSimulations((prev) => ({
                ...prev,
                // Reset the source tab: clear pending changes, restore committed config
                [activeTabID]: {
                    ...prev[activeTabID],
                    committing: false,
                    maxWaitConfig: prev[activeTabID].committedMaxWaitConfig,
                    pendingRunwayChanges: {},
                    pendingPlaneChanges: {},
                    pendingHPTQChanges: {},
                },
                // Create the new branched tab with fresh backend data
                [tabID]: {
                    ...prev[activeTabID],
                    major, minor, version,
                    stateLog, statistics,
                    ...initialFrame,
                    timelineSec: 0,
                    playState: "paused",
                    loading: false,
                    error: null,
                    committing: false,
                    pendingRunwayChanges: {},
                    pendingPlaneChanges: {},
                    pendingHPTQChanges: {},
                    maxWaitConfig: prev[activeTabID].maxWaitConfig,
                    committedMaxWaitConfig: prev[activeTabID].maxWaitConfig,
                },
            }));
            setActiveTabID(tabID);

            // Label the new tab as a config copy (e.g. "Simulation 1.2")
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

    // PLAYBACK LOOP 
    // Fires whenever playState or stateLog changes. When playing, a
    // setInterval advances timelineSec by 1 each interval tick.
    // Interval duration = 1000ms / playbackSpeed for variable speed.
    // Auto-pauses at tick 86,399 (end of 24-hour simulation).
    useEffect(() => {
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

    //  USER EDIT HANDLERS
    // All three follow the same pattern:
    //   1. Update component state immediately for visual feedback
    //   2. Store the edit in a pendingChanges object that survives seekToTick
    //   3. On commit, pending changes are sent to the backend

    // updateRunway: Called by RunwayCard dropdowns (mode/status changes)
    const updateRunway = useCallback((runwayID, changes) => {
        if (!activeTabID) return;
        setSimulations((prev) => {
            const sim = prev[activeTabID];
            return {
                ...prev,
                [activeTabID]: {
                    ...sim,
                    runways: sim.runways.map((r) =>
                        r.id === runwayID ? { ...r, ...changes } : r
                    ),
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

    // updatePlane: Called by HoldingPattern's emergency toggle
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
                    takeoffQueue: updateList(sim.takeoffQueue),
                    holdingPattern: updateList(sim.holdingPattern),
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

    // updateHPTQ: Called by Statistics ConfigBox (max wait threshold changes)
    const updateHPTQ = useCallback((changes) => {
        if (!activeTabID) return;
        setSimulations((prev) => {
            const sim = prev[activeTabID];
            if (!sim) return prev;

            return {
                ...prev,
                [activeTabID]: {
                    ...sim,
                    maxWaitConfig: { ...sim.maxWaitConfig, ...changes },
                    pendingHPTQChanges: {
                        ...sim.pendingHPTQChanges,
                        [sim.timelineSec]: {
                            ...sim.pendingHPTQChanges?.[sim.timelineSec],
                            ...changes,
                        },
                    },
                },
            };
        });
    }, [activeTabID]);

    // PLAYBACK SPEED 
    // If already playing, briefly pauses and resumes to restart the
    // interval with the new speed.
    const setPlaybackSpeed = useCallback((speed) => {
        playbackSpeedRef.current = speed;
        if (activeSim?.playState === "playing") {
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

    //  PROVIDER 
    return (
        <SimulationContext.Provider
            value={{
                // State
                simulations,
                activeTabID,
                activeSim,
                labelMap,
                committing: activeSim?.committing ?? false,

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
            }}
        >
            {children}
        </SimulationContext.Provider>
    );
}