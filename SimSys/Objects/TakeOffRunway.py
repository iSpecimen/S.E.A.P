from SimSys.Objects.runway_class import Runway
from SimSys.Objects.TakeOffQueue import TakeOffQueue

from math import ceil

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .Simulation import Simulation

class TakeOffRunway(Runway[TakeOffQueue]):
    def __init__(self, number : int, bearing : int, takeOffQueue : TakeOffQueue, status : str):
        super().__init__(number, bearing, status)
        self.mode = "Takeoff"
        self.takeOffQueue = takeOffQueue

    def load(self, queue: TakeOffQueue) -> None:
        super().load(queue)

        if self.occupier != None: # if successfuly loaded a plane
            self.expected_free_time = ceil(self._length / self.occupier._ground_speed)

    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not implemented"
    
    def tick_update(self, curr_time: int, sim: "Simulation") -> None:
        if self.free and not self._disabled:
            # Check if there's a plane waiting before trying to load
            if self.takeOffQueue.size > 0:
                self.load(self.takeOffQueue)
                
                # Track statistics upon successful load
                wait_time = curr_time - self.occupier._queue_join_time
                delay = curr_time - self.occupier._scheduled_time
                
                sim.tqueue_wait_times_sum += wait_time
                sim.tqueue_delay_sum += max(0, delay) # Avoid negative delays if early
                sim.max_tqueue_wait = max(sim.max_tqueue_wait, wait_time)
                sim.max_tqueue_delay = max(sim.max_tqueue_delay, delay)
                sim.tqueue_processed += 1
                
        elif self.expected_free_time != 0 and self.occupier is not None:
            if self.occupier.get_mins_left() < 10:
                self.occupier.declare_emergency()
                
            self.expected_free_time -= 1
            self.occupier.update_litres()
        else:
            self.unload()