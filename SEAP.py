#FASTAPI server - bridge between the simulation backend and React frontend

#Endpoints:
# POST /api/simulate : brand-new simulation
# GET /api/state/{major}/{minor} : full state log for a simulation version
# GET /api/sims : list all simulation versions (for populating tabs)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from SimSys.SimulatorControls.SystemController import SystemController


app = FastAPI(title = "SEAP Airport Simulation API")

#Allows the React dev server to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


#Single SystemController instance for the app's lifetime
controller= SystemController()


#POST /api/simulate
@app.post ("/api/simulate")
async def startNewSimulation(request: Request):
    ##Starts a brand new sim
    #All runways start as mixed
    
    body= await request.json()
    numRunways= body.get("num_runways", 4)
    inboundFlow = body.get("inbound_flow", 10)
    outboundFlow= body.get("outbound_flow", 10)
    

    ##Frontend handles number validation
    runwayConfig = (0, numRunways,0)

    #Tries to run a simulation; raises an error if it fails
    try:
        logPath = controller.start_sim(runwayConfig, inboundFlow, outboundFlow)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

    major, minor= controller.get_current_focus()

    return {
        "major": major,
        "minor": minor,
        "version": f"{major}.{minor}",
        "log_file_path": logPath,
        "config": {
            "num_runways":numRunways,
            "inbound_flow": inboundFlow,
            "outbound_flow": outboundFlow
        }
    }
    


# GET /api/state/{major}/{minor}

@app.get("/api/state/{major}/{minor}")
def getFullState(major: int, minor: int):

    file_path, file_name = controller.load_sim((major, minor))

    state_path = Path(file_path)
    gz_path = state_path.with_suffix(state_path.suffix + ".gz")

    if gz_path.exists():
        #send compressed json directly to client
        return FileResponse(path=gz_path, media_type="application/gzip", filename=gz_path.name)
    if state_path.exists():
        #fallback incase no compressed file exists for whatever reason
        return FileResponse(path=state_path, media_type="text/plain; charset=utf-8", filename=state_path.name)

    raise HTTPException(status_code=404, detail=f"State log not found for simulation {major}.{minor}.")
#Returns final aggregated statistics for a completed simulation
@app.get("/api/stats/{major}/{minor}")
def getStatistics(major: int, minor: int):
    sim=getSimulation(major, minor)
    #Initialise them all to 0
    avgTakeoffDelay=0
    avgTakeoffWait=0
    avgHoldingWait=0
    avgHoldingDelay=0
    if sim.tqueue_processed:
        avgTakeoffWait=(sim.tqueue_wait_times_sum / sim.tqueue_processed)
        avgTakeoffDelay= (sim.tqueue_delay_sum / sim.tqueue_processed)
    
    if sim.hqueue_processed:
        avgHoldingWait= (sim.hqueue_wait_times_sum / sim.hqueue_processed)
        avgHoldingDelay= (sim.hqueue_delay_sum / sim.hqueue_processed)
    


    return {
        "version": f"{major}.{minor}",
        "max_tqueue_size": sim.max_tqueue_size,
        "max_hqueue_size": sim.max_hqueue_size,
        "max_tqueue_wait": sim.max_tqueue_wait,
        "max_hqueue_wait": sim.max_hqueue_wait,
        "avg_tqueue_wait": round(avgTakeoffWait, 2),
        "avg_hqueue_wait": round(avgHoldingWait, 2),
        "max_tqueue_delay": sim.max_tqueue_delay,
        "max_hqueue_delay": sim.max_hqueue_delay,
        "avg_tqueue_delay": round(avgTakeoffDelay, 2),
        "avg_hqueue_delay": round(avgHoldingDelay, 2),
        "tqueue_processed": sim.tqueue_processed,
        "hqueue_processed": sim.hqueue_processed,
        "cancelled_planes": sim.cancelled_planes_num,
        "diverted_planes": sim.diverted_planes_num,
    }



# GET /api/sims
#List all the simulation versions
#Fontend uses these to populate tabs
@app.get("/api/sims")
def list_simulations():
    versions=[]
    for major, minors in controller.sim_majors.items():
        for minor, sim in minors.items():
            versions.append({
                "major": major,
                "minor": minor,
                "version": f"{major}.{minor}",
                "sim_name": sim.sim_name,
            })
    
    return versions

# GET /api/newsim/{major}/{minor}
# For Runway Configuration Changes, create a new sim based on current sim.
# For creating new sims based on old configs. 
@app.post("/api/newsim/{major}/{minor}")
async def create_sim_copy(major: int, minor: int, request: Request):
    
    body = await request.json()

    # Runway mode/status list from UI
    # Example: [{"runway_id":0,"mode":"ARRIVAL","status":"OPEN"}, ...]
    runwayChanges = body.get("runway_changes", [])
    print(f"RUNWAY CHANGES FROM FRONTEND: {runwayChanges}")
    planeChanges = body.get("plane_changes", [])
    try:
        logPath = controller.change_runway_config(
            version=(major, minor),
            r_changes=runwayChanges,
            p_changes=planeChanges
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )

    major, minor = controller.get_current_focus()
    num_runways, inbound, outbound = controller.get_sim_details((major,minor))
    
    return {
        "major": major,
        "minor": minor,
        "version": f"{major}.{minor}",
        "log_file_path": logPath,
        "config": {
            "num_runways":num_runways,
            "inbound_flow": inbound,
            "outbound_flow": outbound
        }
    }

# GET /api/copysim/{major}/{minor}
# For when a new tab is made on the front end.
# For creating copies of old sims, to later be changed. 
@app.post("/api/copysim/{major}/{minor}")
async def create_sim_copy(major: int, minor: int):
    try:
        controller.duplicate_simulation(
            major=major,
            minor=minor
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )

    major, minor = controller.get_current_focus()
    
    return {
        "major": major,
        "minor": minor,
        "version": f"{major}.{minor}",
    }



#-------------HELPER FUNCTIONS-----------------------------------
def getSimulation(major:int, minor:int):
    try:
        return controller.sim_majors[major][minor]
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Simulation {major}.{minor} not found.")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app", host="0.0.0.0", port=8000, reload=True)