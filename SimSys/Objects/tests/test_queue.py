
from typing import Any
from SimSys.Objects.queue_class import * 
import pytest

class DummyQueue(Queue):
    def tick_update(self) -> None:
        pass

    def get_json_dict(self) -> dict:
        return {}

    def to_string(self) -> str:
        return "DummyQueue"
    

def test_pop_empty_raises():
    q = DummyQueue()
    with pytest.raises(IndexError):
        q.pop()

def test_push_pop_single():
    q = DummyQueue()
    p = Plane()
    q.push(p)
    assert q.size == 1
    assert q.pop() is p
    assert q.size == 0
    assert q._head is None
    assert q._tail is None

def test_push_two_pop_order_is_fifo():
    q = DummyQueue()
    p1, p2 = Plane(), Plane()
    q.push(p1)
    q.push(p2)
    assert q.pop() is p1
    assert q.pop() is p2
    assert q.size == 0

def test_remove_only_node():
    q = DummyQueue()
    p = Plane()
    q.push(p)
    node = q._head
    assert node is not None

    q.remove(node)
    assert q.size == 0
    assert q._head is None
    assert q._tail is None

def test_remove_head_in_two_nodes():
    q = DummyQueue()
    p1, p2 = Plane(), Plane()
    q.push(p1)
    q.push(p2)
    head = q._head
    assert head is not None

    q.remove(head)
    assert q.size == 1
    assert q._head is not None
    assert q._head.val is p2
    assert q._head.prev is None
    assert q._tail is q._head

def test_remove_tail_in_two_nodes():
    q = DummyQueue()
    p1, p2 = Plane(), Plane()
    q.push(p1)
    q.push(p2)
    tail = q._tail
    assert tail is not None

    q.remove(tail)
    assert q.size == 1
    assert q._tail is not None
    assert q._tail.val is p1
    assert q._tail.next is None
    assert q._head is q._tail

def test_remove_middle_in_three_nodes():
    q = DummyQueue()
    p1, p2, p3 = Plane(), Plane(), Plane()
    q.push(p1); q.push(p2); q.push(p3)

    mid = q._head.next  # type: ignore[union-attr]
    assert mid is not None and mid.val is p2

    q.remove(mid)
    assert q.size == 2
    assert q._head.val is p1  # type: ignore[union-attr]
    assert q._tail.val is p3  # type: ignore[union-attr]
    assert q._head.next is q._tail  # type: ignore[union-attr]
    assert q._tail.prev is q._head  # type: ignore[union-attr]


def test_remove_by_plane_removes_all_matches():
    q = DummyQueue()
    p = Plane()
    q.push(p)
    q.push(Plane())
    q.push(p)

    q.remove(p)

    # should remove both p instances
    assert q.size == 1
    assert q._head is q._tail
    assert q._head is not None
    assert q._head.val is not p


def assert_invariants(q: DummyQueue) -> None:
    # size == 0 ⇒ head/tail None
    if q.size == 0:
        assert q._head is None
        assert q._tail is None
        return

    assert q._head is not None
    assert q._tail is not None
    assert q._head.prev is None
    assert q._tail.next is None

    # walk forward, count nodes, check back-links
    count = 0
    prev = None
    node = q._head
    while node is not None:
        assert node.prev is prev
        prev = node
        node = node.next
        count += 1

    assert prev is q._tail
    assert count == q.size

def test_invariants_after_operations():
    q = DummyQueue()
    p1, p2, p3 = Plane(), Plane(), Plane()
    q.push(p1); assert_invariants(q)
    q.push(p2); assert_invariants(q)
    q.push(p3); assert_invariants(q)
    q.pop();    assert_invariants(q)
    q.remove(p1);assert_invariants(q)


