import numpy as np

class Logger:
    def __init__(self):
        #schemas
        self.__plane_schema : tuple = ("id","callsign","op","origin","dest", "schedule_time","alt","fuel","gs","delayed","emergency","status")
        self.__HoldingQueue : tuple = ("base_alt", "planeIDs") #planeIDs will be in queue order
        self.__TakeoffQueue : tuple = ("planeIDs",) #planeIDs will be in queue order
        self.__runways : tuple = ("runways",) #will just hold array of runways
        self.__runwaySchema : tuple = ("mode", "status", "planeid", "bearing", "number", "time_till_free") # for each runway

        self.__planes : np.array #This should be constant, and populated once the timetable is generated!
    
    def get_state_logs_as_json(tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        if (tick == None and (lower_bound == None or upper_bound == None)):
            raise ValueError("Invalid Arguments!")

        if tick is not None: #specific tick
            raise NotImplementedError()
        else: #logs within given range
            raise NotImplementedError()
