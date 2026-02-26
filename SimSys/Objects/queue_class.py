from __future__ import annotations

from abc import ABC, abstractmethod

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .plane import Plane # type: ignore[attr-defined]

class QueueNode:
    def __init__(self, val: Plane, next: QueueNode | None = None, prev: QueueNode | None = None) -> None:
        self.val: Plane = val
        self.next: QueueNode | None = next
        self.prev: QueueNode | None = prev
        self.emergency_handled : bool = False


class Queue(ABC):
    def __init__(self) -> None:
        self._head: QueueNode | None = None
        self._tail: QueueNode | None = None
        self.size: int = 0

    def push(self, plane: Plane) -> None:
        new_node = QueueNode(plane)

        if self._tail is None:
            self._head = new_node
            self._tail = new_node
        else:
            new_node.prev = self._tail
            self._tail.next = new_node
            self._tail = new_node

        self.size += 1

    def pop(self) -> Plane:
        if self._head is None:
            raise IndexError("pop from empty queue")

        return_val = self._head.val

        if self._head.next is None:
            self._head = None
            self._tail = None
        else:
            self._head = self._head.next
            self._head.prev = None

        self.size -= 1
        return return_val
    
    #only pass members of the queue for now otherwise it will break things :)))
    def remove(self, to_remove: Plane | QueueNode) -> None:
        if isinstance(to_remove, QueueNode):
            node = to_remove

            if node.prev is None:
                self._head = node.next
            else:
                node.prev.next = node.next

            if node.next is None:
                self._tail = node.prev
            else:
                node.next.prev = node.prev

            node.prev = None
            node.next = None

            self.size -= 1
            return
        
        plane = to_remove
        curr = self._head
        while curr is not None:
            nxt = curr.next 
            if curr.val == plane:
                self.remove(curr)
            curr = nxt

    def getNodeAsList(self) -> list[QueueNode]:
        ls = []
        curr = self._head
        while curr is not None:
            ls.append(curr.val)
            curr = curr.next
        
        return ls

    @abstractmethod
    def tick_update(self) -> None:
        ...

    @abstractmethod
    def get_json_dict(self) -> dict:
        ...
    
    @abstractmethod
    def to_string(self) -> str:
        ...
    
