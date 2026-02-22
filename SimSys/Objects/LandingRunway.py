from SimSys.Objects.runway_class import Runway
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue

from math import ceil

class LandingRunway(Runway[HoldingPatternQueue]):
    def __init__(self, number : int, bearing : int, landingQueue : HoldingPatternQueue):
        super().__init__(number, bearing)
        self.mode = "Landing"
        self.landingQueue = landingQueue

    """
    Does not currently consider the distance from the holding pattern to the 
    runway, so calculates the time it needs in the same way as the take off runway.
    Can be easily changed later.
    """
    def load(self, queue: HoldingPatternQueue) -> None:
        super().load(queue)

        if self.occupier != None: # if successfuly loaded a plane
            self.expected_free_time = ceil(self._length / self.occupier._ground_speed)

    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not implemented"
    
    def tick_update(self) -> None:
        if self.free:
            self.load(self.landingQueue)
        elif self.expected_free_time != 0 and self.occupier is not None:
            if self.occupier.get_mins_left() < 10:
                self.occupier.declare_emergency()
                
            self.expected_free_time -= 1
            self.occupier.update_litres()
        else:
            self.unload()