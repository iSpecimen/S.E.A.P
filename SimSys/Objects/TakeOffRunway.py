from SimSys.Objects.runway_class import Runway
from SimSys.Objects.TakeOffQueue import TakeOffQueue

from math import ceil

TheTakeoffQueue = TakeOffQueue() #placeholder for now

class TakeOffRunway(Runway[TakeOffQueue]):
    def __init__(self, number : int, bearing : int):
        super().__init__(number, bearing)
        self.mode = "Takeoff"

    def load(self, queue: TakeOffQueue) -> None:
        super().load(queue)

        if self.occupier != None: # if successfuly loaded a plane
            self.expected_free_time = ceil(self._length / self.occupier.ground_speed)

    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not implemented"
    
    def tick_update(self) -> None:
        if self.free:
            self.load(TheTakeoffQueue)
        elif self.expected_free_time != 0 and self.occupier is not None:
            if self.occupier.get_mins_left() < 10:
                self.occupier.declare_emergency()
                
            self.expected_free_time -= 1
            self.occupier.update_litres()
        else:
            self.unload()

    
