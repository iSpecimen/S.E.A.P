/*Allows all backend communication to be in one place
* Components go through SimulationContext and these functions
 */


const BASE_URL = "http://localhost:8000";

/**
 * POST /api/simulate
 * Sends start page inputs, waits for sim to finish.
 * Returns { major, minor, version, config }
 */
export async function startSimulation({ numRunways, inboundFlow, outboundFlow }) {
  const res = await fetch(`${BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      num_runways: numRunways,
      inbound_flow: inboundFlow,
      outbound_flow: outboundFlow,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Simulation failed (${res.status})`);
  }

  return res.json();
}

/**
 * POST /api/newsim/{major}/{minor}
 * Sends a new runway config to run a new sim with.
 * Returns { major, minor, version, config }
 */
export async function changeSimulation({ major, minor, runway_config }) {
  const res = await fetch(`${BASE_URL}/api/newsim/${major}/${minor}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runway_config: runway_config
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Simulation failed (${res.status})`);
  }

  return res.json();
}

/**
 * POST /api/copysim/{major}/{minor}
 * Tells the backend SystemController to store a new copy of a sim and label it accordingly.
 * Returns { major, minor, version}
 */
export async function copySimulation({ major, minor}) {
  const res = await fetch(`${BASE_URL}/api/newsim/${major}/${minor}`, {
    method: "POST"
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Simulation failed (${res.status})`);
  }

  return res.json();
}



/**
 * GET /api/state/{major}/{minor}
 * Returns the full array of 86,400 tick states.
 */
export async function fetchFullState(major, minor) {
  const res = await fetch(`${BASE_URL}/api/state/${major}/${minor}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch state (${res.status})`);
  }

  return res.json();
}

/**
 * GET /api/stats/{major}/{minor}
 * Returns final aggregated statistics.
 */
export async function fetchStatistics(major, minor) {
  const res = await fetch(`${BASE_URL}/api/stats/${major}/${minor}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch stats (${res.status})`);
  }

  return res.json();
}


/**
 * GET /api/sims
 * Returns list of all simulation versions (for tab bar).
 */
export async function fetchSimulationList() {
  const res = await fetch(`${BASE_URL}/api/sims`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch sim list (${res.status})`);
  }

  return res.json();
}












