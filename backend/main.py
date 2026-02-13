from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app= FastAPI(
    title="Simulation API",
    description="API that gets a simulation",
    version="0.1.0",
    docs_url="/docs",
    redocs_url="/redocs"
)

#This allows the backend to communicate with the different origins
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],
    allow_credentials=True, #Allow someone to send credentials to the backend
    allow_methods=["*"], #Allow operations like GET, POST
    allow_headers=["*"], #Allow extra information from the headers
)

if __name__ == "__main__":
    #Allows us to serve our fastAPI application 
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
