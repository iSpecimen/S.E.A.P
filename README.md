# S.E.A.P
CS261 Software Engineering Project

## Running Backend Tests

1. If not done already, create the python virtual environment (venv) with the command ``` python3 -m venv .venv ```
2. Activate the venv on Windows with ``` .venv/Scripts/Activate ```, or Linux and MacOS with ``` .venv/bin/activate ```
3. Run ``` python3 -m pytest ```. This will then run all tests, in all directories, with a file name starting with test.

## Running SEAP for developers.

1. In your S.E.A.P directory, ensure that all modules are installed, mainly being: (using pip install fastapi.. etc)
fastapi, uvicorn, (json??).. any error messages that may come up will tell you

2. Downloading npm. [Go to this link to install LTS for Windows, using Docker and npm.](https://nodejs.org/en/download)
It should be stored in your PATH env variables for your pc/laptop. 

There may be a few modules that i'm forgetting, I'd ask Gargi/Neen if you're having any issues, I followed this from them. 
I think there's maybe a module called vite? I cannot remember. 

Go to S.E.A.P/ReplaySys and run "npm install".

## Now running it:

You need 2 terminals. One in the S.E.A.P directory, and one in S.E.A.P/ReplaySys 

In the first one, you just need to run s
"uvicorn SEAP:app --reload --port 8000"

In ReplaySys, after running the first command, run
"npm run dev" 

Then simply open a browser tab to http://localhost:5173/ or whichever URL is shown in vite (The terminal tab with npm)