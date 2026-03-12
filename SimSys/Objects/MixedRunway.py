from __future__ import annotations
from SimSys.Objects.runway_class import Runway
from SimSys.Objects.TakeOffQueue import TakeOffQueue
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue
from SimSys.Objects.queue_class import Queue
from math import ceil
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Simulation import Simulation

#2:1 Ratio - takeoff queue should aim to be 2x size of landing queue

class MixedRunway(Runway[Queue]):
    def __init__(self, number : int, bearing : int, takeoffQueue : TakeOffQueue, landingQueue : HoldingPatternQueue, status : str):
        super().__init__(number, bearing, status)
        self.mode = "Mixed"
        self.takeOffQueue = takeoffQueue
        self.landingQueue = landingQueue

    def load(self, queue : Queue, queue2 : TakeOffQueue | None = None):
        if queue2 is None:
            raise ValueError("Takeoff queue object must not be None!")

        if queue2.size > 0 and (queue.size == 0 or queue2.size > 2 * queue.size):
            super().load(queue2)
        elif queue.size > 0:
            super().load(queue)
        
        if self.occupier != None: 
            self.expected_free_time = ceil(self._length / self.occupier._ground_speed)

    def tick_update(self, curr_time: int, sim: Simulation) -> None:
        if self.free and not self._disabled:
            if self.landingQueue.size > 0 or self.takeOffQueue.size > 0:
                self.load(self.landingQueue, self.takeOffQueue)
                
                if self.occupier is not None:
                    wait_time = curr_time - self.occupier._queue_join_time
                    delay = curr_time - self.occupier._scheduled_time
                    
                    # Route the stats based on the plane type
                    if self.occupier._is_arrival:
                        sim.hqueue_wait_times_sum += wait_time
                        sim.hqueue_delay_sum += max(0, delay)
                        sim.max_hqueue_wait = max(sim.max_hqueue_wait, wait_time)
                        sim.max_hqueue_delay = max(sim.max_hqueue_delay, delay)
                        sim.hqueue_processed += 1
                    else:
                        sim.tqueue_wait_times_sum += wait_time
                        sim.tqueue_delay_sum += max(0, delay)
                        sim.max_tqueue_wait = max(sim.max_tqueue_wait, wait_time)
                        sim.max_tqueue_delay = max(sim.max_tqueue_delay, delay)
                        sim.tqueue_processed += 1

        elif self.expected_free_time > 0 and self.occupier is not None:
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