from SimSys.Objects.runway_class import Runway
from SimSys.Objects.TakeOffQueue import TakeOffQueue
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue
from SimSys.Objects.queue_class import Queue

from math import ceil

TheTakeoffQueue = TakeOffQueue() #placeholder for now
TheLandingQueue = HoldingPatternQueue(1000) #placeholder for now

#2:1 Ratio - takeoff queue should aim to be 2x size of landing queue

class MixedRunway(Runway[Queue]):
    def __init__(self, number : int, bearing : int):
        super().__init__(number, bearing)
        self.mode = "Mixed"

    def load(self, queue : Queue, queue2 : TakeOffQueue | None = None):
        if queue2 is None:
            raise ValueError("Takeoff queue object must not be None!")

        if queue2.size > 0 and (queue.size == 0 or queue2.size > 2 * queue.size):
            super().load(queue2)
        elif queue.size > 0:
            super().load(queue)
        
        if self.occupier != None: # if successfuly loaded a plane
            self.expected_free_time = ceil(self._length / self.occupier.ground_speed)

    def tick_update(self) -> None:
        if self.free:
            self.load(TheLandingQueue, TheTakeoffQueue)
        elif self.expected_free_time != 0 and self.occupier is not None:
            if self.occupier.get_mins_left() < 10:
                self.occupier.declare_emergency()
                
            self.expected_free_time -= 1
            self.occupier.update_litres()
        else:
            self.unload()

    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"