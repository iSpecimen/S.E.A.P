"""
Concrete class for runways handling both arriving and departing traffic.
Maintains a 2:1 ratio, prioritizing departures if the takeoff queue is 
more than twice the size of the holding pattern.
"""

from __future__ import annotations
from SimSys.Objects.runway_class import Runway
from SimSys.Objects.TakeOffQueue import TakeOffQueue
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue
from SimSys.Objects.queue_class import Queue
from math import ceil
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Simulation import Simulation

class MixedRunway(Runway[Queue]):
    """Runway designed to flexibly handle both takeoffs and landings based on demand."""
    
    def __init__(self, number: int, bearing: int, takeoffQueue: TakeOffQueue, landingQueue: HoldingPatternQueue, status: str) -> None:
        """Initializes the mixed runway with references to both queues."""
        super().__init__(number, bearing, status)
        self.mode: str = "Mixed"
        self.takeOffQueue: TakeOffQueue = takeoffQueue
        self.landingQueue: HoldingPatternQueue = landingQueue

    def load(self, queue: Queue, queue2: TakeOffQueue | None = None) -> None:
        """
        Loads a plane from either queue. 
        Enforces a 2:1 ratio, aiming to keep the takeoff queue no larger than 2x the landing queue.
        """
        if queue2 is None:
            raise ValueError("Takeoff queue object must not be None!")

        if queue2.size > 0 and (queue.size == 0 or queue2.size > 2 * queue.size):
            super().load(queue2)
        elif queue.size > 0:
            super().load(queue)
        
        if self.occupier is not None: 
            timing: float = self._length / self.occupier._ground_speed
            self.expected_free_time = ceil(timing)

    def tick_update(self, curr_time: int, sim: Simulation) -> None:
        """Processes operations and correctly routes the resulting statistics based on plane type."""
        if self.free and not self._disabled:
            
            if self.landingQueue.size > 0 or self.takeOffQueue.size > 0:
                self.load(self.landingQueue, self.takeOffQueue)
                
                if self.occupier is not None:
                    wait_time: int = curr_time - self.occupier._queue_join_time
                    delay: int = curr_time - self.occupier._scheduled_time
                    
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