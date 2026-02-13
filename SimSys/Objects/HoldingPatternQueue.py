from SimSys.Objects.queue_class import Queue,Plane

class HoldingPatternQueue(Queue):
    def __init__(self, base_altitude : float):
        super().__init__()

        self.base_altitude : float = base_altitude
        self.curr_max_altitude : float = 0 #Default to 0 if empty

    #adding 1000ft of vertical separation
    def push(self, plane: Plane) -> None:
        if self.size == 0:
            self.curr_max_altitude = self.base_altitude
        else:
            self.curr_max_altitude += 1000
        
        super().push(plane)

    #decreasing maximum altitude
    def pop(self) -> Plane:
        if self.size == 1:
            self.curr_max_altitude = 0
        else:
            self.curr_max_altitude -= 1000
        
        return super().pop()
    
    def tick_update(self) -> None:
        ...
    
    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"



        
