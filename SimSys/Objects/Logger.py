import numpy as np
from operator import attrgetter

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .HoldingPatternQueue import HoldingPatternQueue # type: ignore[attr-defined]
    from .TakeOffQueue import TakeOffQueue # type: ignore[attr-defined]
    from .runway_class import Runway # type: ignore[attr-defined]

class Logger:
    def __init__(self):
        #schemas
        self.__plane_schema : tuple = ("id","callsign","op","origin","dest", "schedule_time","alt","fuel","gs","delayed","emergency","status")
        self.__HoldingQueue : tuple = ("base_alt", "planeIDs") #planeIDs will be in queue order
        self.__TakeoffQueue : tuple = ("planeIDs",) #planeIDs will be in queue order
        self.__runways : tuple = ("runways",) #will just hold array of runways
        self.__runwaySchema : tuple = ("mode", "status", "planeid", "bearing", "number", "time_till_free") # for each runway

        self.__plane_get = attrgetter(*self.__plane_schema)
        self.__holding_queue_get = attrgetter(
            lambda q: q.base_alt,
            lambda q: [p.id for p in q.queue]
        )
        self.__takeoff_queue_get = attrgetter(
            lambda q: [p.id for p in q.queue]
        )
        self.__runway_get = attrgetter(*self.__runwaySchema)

        self.__planes : np.array #This should be constant, and populated once the timetable is generated!

    def add_state_log(self, tick : int, holding_pattern : HoldingPatternQueue, takeoff_queue : TakeOffQueue, runways : list[Runway]):
        ...

    #usage: get_state_logs_as_json(tick=x) OR get_sate_logs(lower_bound = x, upper_bound = x)
    def get_state_logs_as_json(self, tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        if (tick == None and (lower_bound == None or upper_bound == None)):
            raise ValueError("Invalid Arguments!")

        if tick is not None: #specific tick
            raise NotImplementedError()
        else: #logs within given range
            raise NotImplementedError()
