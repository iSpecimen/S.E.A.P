"""
Doubly-linked list implementation for airport queues, serving as the base 
class for holding patterns and takeoff queues.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .Plane import Plane 

class QueueNode:
    """Represents a single node in the doubly-linked Queue list."""
    def __init__(self, val: Plane, next: QueueNode | None = None, prev: QueueNode | None = None) -> None:
        self.val: Plane = val
        self.next: QueueNode | None = next
        self.prev: QueueNode | None = prev
        self.emergency_handled: bool = False

class Queue(ABC):
    """Abstract base queue maintaining a head, tail, and size tracker."""
    def __init__(self) -> None:
        self._head: QueueNode | None = None
        self._tail: QueueNode | None = None
        self.size: int = 0

    def push(self, plane: Plane) -> None:
        """Appends a Plane to the tail of the queue."""
        new_node: QueueNode = QueueNode(plane)

        if self._tail is None:
            self._head = new_node
            self._tail = new_node
        else:
            new_node.prev = self._tail
            self._tail.next = new_node
            self._tail = new_node

        self.size += 1

    def pop(self) -> Plane:
        """Removes and returns the Plane from the head of the queue."""
        if self._head is None:
            raise IndexError("pop from empty queue")

        return_val: Plane = self._head.val

        if self._head.next is None:
            self._head = None
            self._tail = None
        else:
            self._head = self._head.next
            self._head.prev = None

        self.size -= 1
        return return_val
    
    def remove(self, to_remove: Plane | QueueNode) -> None:
        """Removes a specific Plane or QueueNode directly from the linked list."""
        if isinstance(to_remove, QueueNode):
            node: QueueNode = to_remove

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
        
        plane: Plane = to_remove
        curr: QueueNode | None = self._head
        while curr is not None:
            nxt: QueueNode | None = curr.next 
            if curr.val == plane:
                self.remove(curr)
            curr = nxt

    def getNodeAsList(self, countTarget: int = 10) -> list[Plane]:
        """Iterates from head, converting nodes to a list up to a target count."""
        ls: list[Plane] = []
        count: int = 0
        curr: QueueNode | None = self._head
        
        while curr is not None and count < countTarget:
            ls.append(curr.val)
            curr = curr.next
            count += 1
        
        return ls

    @abstractmethod
    def tick_update(self, curr_time: int, sim: Any, logger: Any) -> None:
        """Abstract simulation tick progression implemented by subclasses."""
        ...