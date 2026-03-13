from __future__ import annotations

from .queue_class import Queue

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .Simulation import Simulation
    from .Logger import Logger

class TakeOffQueue(Queue):
    def __init__(self):
        super().__init__()

    def tick_update(self, curr_time: int, sim: Simulation, logger : Logger) -> None:
        next_item = self._head
        while (next_item != None):
            nxt = next_item.next
            plane = next_item.val
            plane.update_litres()

            if (curr_time - plane._queue_join_time) > sim.current_max_twait:
                logger.add_event_log(curr_time, f"CANCELLATION: {plane.callsign} cancelled. Exceeded max wait time ({sim.current_max_twait}s).")
                sim.cancelled_planes_num += 1
                sim.add_cancellation_diversion_event(curr_time, plane.callsign, "Cancellation")
                self.remove(next_item)

            next_item = nxt
    
    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"