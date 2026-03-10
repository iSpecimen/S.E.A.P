import React, { useCallback } from "react";
import "./SimulationTab.css";
import { useSimulation } from "../context/SimulationContext";

export default function SimulationTab() {
  const {
    simulations,
    activeTabID,
    labelMap,
    switchTab,
    removeSimulation,
    duplicateSimulation,
    requestNewSimulation,
  } = useSimulation();

  // Derive tabs from context
  const tabIDs = Object.keys(simulations);

  // ── Build display label from context's labelMap ──
  const getLabel = (tabID) => {
    const info = labelMap[tabID];
    if (!info) {
      const sim = simulations[tabID];
      if (sim?.loading) return "Loading...";
      return "Simulation";
    }
    if (info.copyNumber != null) {
      return `Simulation ${info.simNumber}.${info.copyNumber}`;
    }
    return `Simulation ${info.simNumber}`;
  };

  // ── Switch tab ──
  const activate = useCallback(
    (id) => {
      switchTab(id);
    },
    [switchTab]
  );

  // ── + New Simulation ──
  // Clears activeTabID → App.jsx renders StartPage → user enters new config.
  // The sim counter is incremented in context's createSimulation when the user submits.
  const addSimulation = useCallback(() => {
    requestNewSimulation();
  }, [requestNewSimulation]);

  // ── Copy Config ──
  // Deep-copies the active simulation into a new tab.
  // Label assignment (X.1, X.2) is handled by context's duplicateSimulation.
  const copyConfig = useCallback(() => {
    if (!activeTabID) return;
    const newID = `${activeTabID}_copy_${Date.now()}`;
    duplicateSimulation(activeTabID, newID);
  }, [activeTabID, duplicateSimulation]);

  // ── Close tab ──
  const closeTab = useCallback(
    (id) => {
      const remaining = tabIDs.filter((k) => k !== id);
      if (remaining.length === 0) {
        removeSimulation(id);
        requestNewSimulation();
      } else {
        if (activeTabID === id) {
          const idx = tabIDs.indexOf(id);
          const next = remaining[Math.min(idx, remaining.length - 1)];
          switchTab(next);
        }
        removeSimulation(id);
      }
    },
    [tabIDs, activeTabID, removeSimulation, switchTab, requestNewSimulation]
  );

  return (
    <div className="SimTabWrapper">
      <div className="SimTabBar">
        <div className="SimTabScroll">
          {tabIDs.map((tabID) => {
            const isActive = tabID === activeTabID;
            const sim = simulations[tabID];
            const isPlaying = sim?.playState === "playing";
            const isCopy = labelMap[tabID]?.copyNumber != null;

            return (
              <button
                key={tabID}
                className={`SimTab ${isActive ? "SimTabActive" : ""} ${isCopy ? "SimTabConfig" : ""}`}
                onClick={() => activate(tabID)}
                title={getLabel(tabID)}
              >
                <span
                  className={`SimTabDot ${
                    isPlaying ? "SimTabDotPlaying" : "SimTabDotPaused"
                  }`}
                />

                <span className="SimTabLabel">{getLabel(tabID)}</span>

                <span
                  className="SimTabClose"
                  role="button"
                  tabIndex={0}
                  aria-label={`Close ${getLabel(tabID)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabID);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      closeTab(tabID);
                    }
                  }}
                >
                  ×
                </span>
              </button>
            );
          })}
        </div>

        <div className="SimTabActions">
          <button className="SimTabButtonCopy" onClick={copyConfig}>
            Copy Config
          </button>
          <button className="SimTabButtonNew" onClick={addSimulation}>
            + New Simulation
          </button>
        </div>
      </div>
    </div>
  );
}