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
            next_item.val.update_litres()
            next_item = next_item.next
    
    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"