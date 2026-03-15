# S.E.A.P
CS261 Software Engineering Project.
This is the Developer guide; for the User Guide which walks you through the application, see "SEAP User Guide".

## Running Backend Tests

1. If not done already, create the python virtual environment (venv) with the command ``` python3 -m venv .venv ```
2. Activate the venv on Windows with ``` .venv/Scripts/Activate ```, or Linux and MacOS with ``` .venv/bin/activate ```
3. Run ``` python3 -m pytest ```. This will then run all tests, in all directories, with a file name starting with test.

## Running SEAP for developers.

## Prerequisites

### Node.js (includes npm)
Download and install from [https://nodejs.org](https://nodejs.org) (LTS version recommended).
Verify installation:
```bash
node --version
npm --version
```

### Python 3.10+
Download and install from [https://www.python.org](https://www.python.org).
Verify installation:
```bash
python --version
pip --version
```

## Setup

Open two different terminals, one to run the backend and one to run the frontend.

### Backend
For the backend, stay in the outermost directory (i.e. S.E.A.P)- you don't need to cd into any other one.
```bash
pip install -r requirements.txt
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
For the frontend, you need to be in the "ReplaySys" directory: this is where all the frontend code is.
```bash
cd ReplaySys
npm install
npm run dev
```

## Now running it:

You need 2 terminals. One in the S.E.A.P directory, and one in S.E.A.P/ReplaySys 

In the backend one (S.E.A.P directory), you just need to run:
"uvicorn SEAP:app --reload --port 8000"

In ReplaySys (the frontend), run: 
"npm run dev" 

Then simply open a browser tab to http://localhost:5173/ or whichever URL is shown in vite (The terminal tab with npm)


## Project Structure
```
S.E.A.P/
├── ReplaySys/                      # Frontend (React + Vite)
│   └── src/
│       ├── components/
│       │   ├── ArrivalsDepartures.jsx / .css
│       │   ├── Cancellations.jsx / .css
│       │   ├── FlightQueue.jsx / .css
│       │   ├── HoldingPattern.jsx
│       │   ├── RunwayCard.jsx / .css
│       │   ├── SimulationTab.jsx / .css
│       │   ├── Statistics.jsx / .css
│       │   ├── TakeoffQueue.jsx
│       │   └── Timeline.jsx / .css
│       ├── context/
│       │   └── SimulationContext.jsx    # Central state management
│       ├── pages/
│       │   ├── MainPage.jsx / .css
│       │   └── StartPage.jsx / .css
│       ├── services/
│       │   └── api.js                  # Backend API client
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── SimSys/                             # Backend (Python + FastAPI)
│   ├── Objects/
│   │   ├── HoldingPatternQueue.py
│   │   ├── LandingRunway.py
│   │   ├── Logger.py
│   │   ├── MixedRunway.py
│   │   ├── Plane.py
│   │   ├── queue_class.py
│   │   ├── runway_class.py
│   │   ├── Simulation.py
│   │   ├── TakeOffQueue.py
│   │   ├── TakeOffRunway.py
│   │   └── tests/
│   ├── SimulatorControls/
│   │   └── SystemController.py
│   ├── __init__.py
│   └── testfile.py
│
├── logs/                               # Simulation output logs
├── SEAP.py                             # Backend entry point (FastAPI server)
├── requirements.txt                    # Python dependencies
├── SEAP- User Guide
└── README.md

```
