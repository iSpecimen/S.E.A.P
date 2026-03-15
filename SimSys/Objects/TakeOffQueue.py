"""
Concrete class for Departure Queues processing standard waiting ground aircraft.
"""

from __future__ import annotations
from .queue_class import Queue
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Simulation import Simulation
    from .Logger import Logger

class TakeOffQueue(Queue):
    """Manages planes waiting to depart on the tarmac."""
    def __init__(self) -> None:
        super().__init__()

    def tick_update(self, curr_time: int, sim: "Simulation", logger: "Logger") -> None:
        """Scans waiting aircraft for timeouts, triggering cancellations if necessary."""
        next_item: QueueNode | None = self._head
        
        while next_item is not None:
            nxt: QueueNode | None = next_item.next
            plane: Plane = next_item.val
            plane.update_litres()

            wait_duration: int = curr_time - plane._queue_join_time
            
            if wait_duration > sim.current_max_twait:
                logger.add_event_log(curr_time, f"CANCELLATION: {plane.callsign} cancelled. Exceeded max wait time ({sim.current_max_twait}s).")
                sim.cancelled_planes_num += 1
                sim.add_cancellation_diversion_event(curr_time, plane.callsign, "Cancellation")
                self.remove(next_item)

            next_item = nxt