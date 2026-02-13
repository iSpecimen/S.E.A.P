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
    
    def tick_update(self):
        if self.free:
            self.load(TheTakeoffQueue)
        elif self.expected_free_time != 0:
            self.expected_free_time -= 1
        else:
            self.unload()

    
