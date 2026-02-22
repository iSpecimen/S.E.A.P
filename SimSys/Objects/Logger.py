import numpy as np
from operator import attrgetter
from typing import Any
from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .runway_class import Runway
import json
from pathlib import Path
from .Plane import Plane
from datetime import datetime
import uuid

class Logger:
    def __init__(self):
        #schemas
        self.__plane_schema : tuple = ("callsign","operator","origin","destination", "_scheduled_time","_altitude","_fuel_seconds","_ground_speed","_delayed","_emergency")
        self.__HoldingQueue : tuple = ("base_altitude", "callsigns") #planeIDs will be in queue order
        self.__TakeoffQueue : tuple = ("callsigns",) #planeIDs will be in queue order
        self.__runways : tuple = ("runways",) #will just hold array of runways
        self.__runwaySchema : tuple = ("mode", "status", "callsigns", "bearing", "number", "expected_free_time") # for each runway

        self.__plane_get = attrgetter(*self.__plane_schema)
        self.__runway_attr_get = attrgetter(
            "mode", "status", "bearing", "number", "expected_free_time"
        )

        self.run_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        self._file_path = log_dir / f"state_{self.run_id}.jsonl"
        self._file = Path(self._file_path).open("w", encoding="utf-8")

    def _queue_planes_as_dicts(self, q):
        rows = [self.__plane_get(p) for p in q.getNodeAsList()]
        return self.rows_to_dicts(self.__plane_schema, rows)

    @staticmethod
    def _runway_callsign(r) -> str:
        return "N/A" if r.occupier is None else r.occupier.callsign

    @staticmethod
    def rows_to_dicts(schema, rows):
        return [dict(zip(schema, row)) for row in rows]

    #Note: differs from UML because creating many dictionaries at runtime is resource intensive
    def add_state_log(self, tick : int, holding_pattern : HoldingPatternQueue, takeoff_queue : TakeOffQueue, runways : list[Runway]):
        holding_values = [
            holding_pattern.base_altitude,
            self._queue_planes_as_dicts(holding_pattern),
        ]

        takeoff_values = [
            self._queue_planes_as_dicts(takeoff_queue),
        ]

        runway_rows = []
        for r in runways:
            mode, status, bearing, number, expected_free_time = self.__runway_attr_get(r)
            runway_rows.append((
                mode,
                status,
                self._runway_callsign(r),
                bearing,
                number,
                expected_free_time,
            ))

        payload = {
            "tick": tick,

            "HoldingQueue": dict(zip(self.__HoldingQueue, holding_values)),

            "TakeoffQueue": dict(zip(self.__TakeoffQueue, takeoff_values)),

            "runways": self.rows_to_dicts(self.__runwaySchema, runway_rows),
        }

        line = json.dumps(payload, separators=(",", ":"))
        self._file.write(line + "\n")


    #usage: get_state_logs_as_json(tick=x) OR get_sate_logs(lower_bound = x, upper_bound = x)
    def get_state_logs_as_json(self, tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        if (tick == None and (lower_bound == None or upper_bound == None)):
            raise ValueError("Invalid Arguments!")

        if tick is not None: #specific tick
            raise NotImplementedError()
        else: #logs within given range
            raise NotImplementedError()
        
    def clear_log_file(self) -> None:
        if self._file_path.exists():
            self._file.close()
            self._file_path.unlink()

