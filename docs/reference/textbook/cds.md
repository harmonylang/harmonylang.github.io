
# Concurrent Data Structures 

The most common use for locks is in building concurrent data structures.
By way of example, we will first demonstrate how to build a concurrent
queue. The `queue` module will have the following API:

-   $q = \mathtt{Queue}()$: allocate a new queue;

-   $\mathtt{put}(q, v)$: add $v$ to the tail of the queue;

-   $r = \mathtt{get}(q)$: returns $r = \mathtt{None}$ if $q$ is empty
    or $r = v$ if $v$ was at the head of the queue.

See for a simple demonstration program that uses the queue.

We will first implement the queue as a linked list. The implementation
in uses the `alloc` module for dynamic allocation of nodes in the list
using `malloc`() and `free`(). `malloc`($v$) returns a new memory
location initialized to $v$, which should be released with `free`() when
it is no longer in use. The queue maintains a `head` pointer to the
first element in the list and a `tail` pointer to the last element in
the list. The `head` pointer is `None` if and only if the queue is
empty. (`None` is a special address value that is not the address of any
memory location.)

`queue.Queue()` returns a new queue object consisting of a `None` head
and tail pointer and a lock. $\mathtt{queue.put}(q, v)$ and
$\mathtt{queue.get}(q)$ both take a pointer $q$ to the queue object
because both may modify the queue. Before they access the value of the
head or tail of the queue they first obtain the lock. When they are
done, they release the lock.

An important thing to note in is Lines 7 and 8. It would be incorrect to
replace these by:

**assert** `queue.get`(*q*) in { **None**, 1, 2 }

The reason is that `queue.get()` changes the state by acquiring a lock,
but the expressions in **assert** statements (or **invariant**
statements) are not allowed to change the state. In general, when
calling methods in **assert** or **invariant** statements, one has to be
convinced that those methods cannot change the state in any way.

shows another concurrent queue implementation. It is well-known,
but what is not often realized is that it requires sequentially
consistent memory, which is not said explicitly in the paper. As a
result, the algorithm is not guaranteed to work correctly with most
modern programming languages and computer hardware. But it is still
useful to study it. The implementation uses separate locks for the head
and the tail, allowing a `put` and a `get` operation to proceed
concurrently. To avoid contention between the head and the tail, the
queue uses a dummy node at the head of the linked list. Except
initially, the dummy node is the last node that was dequeued. Note that
neither the `head` nor `tail` pointer are ever `None`. The problem is
when the queue is empty and there are concurrent `get` and `put`
operations. They obtain separate locks and then concurrently access the
`next` field in the dummy node---a data race with undefined semantics in
most environments.


```python
import queue

def sender(q, v):
    queue.put(q, v)

def receiver(q):
    let v = queue.get(q):
        assert v in { None, 1, 2 }
demoq = queue.Queue()
spawn sender(?demoq, 1)
spawn sender(?demoq, 2)
spawn receiver(?demoq)
spawn receiver(?demoq)
```


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def Queue():
    result = { .head: None, .tail: None, .lock: Lock() }

def put(q, v):
    let node = malloc({ .value: v, .next: None }):
        acquire(?q->lock)
        if q->tail == None:
            q->tail = q->head = node
        else:
            q->tail->next = node
            q->tail = node
        release(?q->lock)
    

def get(q):
    acquire(?q->lock)
    let node = q->head:
        if node == None:
            result = None
        else:
            result = node->value
            q->head = node->next
            if q->head == None:
               q->tail = None
            free(node)
    release(?q->lock)
```


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def Queue():
    let dummy = malloc({ .value: (), .next: None }):
        result = { .head: dummy, .tail: dummy, .hdlock: Lock(), .tllock: Lock() }

def put(q, v):
    let node = malloc({ .value: v, .next: None }):
        acquire(?q->tllock)
        q->tail->next = node
        q->tail = node
        release(?q->tllock)

def get(q):
    acquire(?q->hdlock)
    let dummy = q->head
    let node = dummy->next:
        if node == None:
            result = None
            release(?q->hdlock)
        else:
            result = node->value
            q->head = node
            release(?q->hdlock)
            free(dummy)
```


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def _node(v, n):     # allocate and initialize a new list node
    result = malloc({ .lock: Lock(), .value: v, .next: n })

def _find(lst, v):
    var before = lst
    acquire(?before->lock)
    var after = before->next
    acquire(?after->lock)
    while after->value < v:
        release(?before->lock)
        before = after
        after = before->next
        acquire(?after->lock)
    result = (before, after)

def LinkedList():
    result = _node(–inf, _node(inf, None))

def insert(lst, v):
    let before, after = _find(lst, v):
        if after->value != v:
            before->next = _node(v, after)
        release(?after->lock)
        release(?before->lock)

def remove(lst, v):
    let before, after = _find(lst, v):
        if after->value == v:
            before->next = after->next
            release(?after->lock)
            free(after)
        else:
            release(?after->lock)
        release(?before->lock)

def contains(lst, v):
    let before, after = _find(lst, v):
        result = after->value == v
        release(?after->lock)
        release(?before->lock)
```


```python
from linkedlist import *
mylist = LinkedList()

def thread1():
    insert(mylist, 1)
    let x = contains(mylist, 1):
        assert x

def thread2(v):
    insert(mylist, v)
    remove(mylist, v)
spawn thread1()
spawn thread2(0)
spawn thread2(2)
```

A queue has the nice property that usually only the head or the tail is
accessed. However, in many data structures it is necessary to "walk" the
data structure, an operation that can take significant time. In such a
case, a single lock (known as a "big lock") for the entire data
structure might restrict concurrency to an unacceptable level. To reduce
the granularity of locking, each node in the data structure must be
endowed with its own lock instead.

implements an ordered linked list of integers without duplicates. (
contains test code.) Values can be added using `insert` or deleted using
`remove`. Method `contains` checks if a particular value is in the list.

The list has two dummy "book-end" nodes with values `-inf` and `inf`
(similar to the Python `math.inf` constant). An invariant of the
algorithm is that at any point in time the list is "valid," starting
with a `-inf` node and ending with a `inf` node.

Each node has a lock, a value, and *next*, a pointer to the next node
(which is `None` for the final `inf` node). The `_find(lst, v)` helper
method first finds and locks two consecutive nodes *before* and *after*
such that
$\mathit{before}$->$\mathtt{data.value} < v \le \mathit{after}$->$\mathtt{data.value}$.
It does so by performing something called *hand-over-hand locking*. It
first locks the first node, which is the `-inf` node. Then, iteratively,
it obtains a lock on the next node and release the lock on the last one,
and so on, similar to climbing a tree hand-over-hand. Using `_find` the
`insert`, `remove`, and `contains` methods are fairly straightforward.

Like the queue in , the implementation of the list is
*linearizable*, a strong notion of consistency that makes it
appear as if each of the operations executes atomically at some point
between their invocation and return. Determining if an implementation of
a concurrent data structure is linearizable involves finding what are
known as the *linearization points* of the operations in an execution.
These are the unique points in time at which an operation appears to
execute atomically. The linearization point for the `insert` operation
coincides exactly with the update of the *before*.`next` pointer. The
linearization point of a `contains` method execution depends on whether
the value is found or not. If found, it coincides with retrieving the
pointer to the node that has the value. If not found, it coincides with
retrieving the pointer to the `inf` node.

## Exercises 


$\mathtt{contains}(q, v)$ to that checks to see if $v$ is in queue $q$.

Add a method $\mathtt{length}(q)$ to that returns the length of the
given queue. The complexity of the method should be $O(1)$, which is to
say that you should maintain the length of the queue as a field member
and update it in `put` and `get`.

$\mathtt{check}(q)$ that checks the integrity of the queue in . In
particular, it should check the following integrity properties:

-   If the list is empty, $q$->$\mathtt{tail}$ should be
    `None`. Otherwise, the last element in the linked list starting from
    $q$->$\mathtt{head}$ should equal
    $q$->$\mathtt{head}$. Moreover,
    $q$->$\texttt{tail}$->$next$ should be `None`;

-   The length field that you added in should equal the length of the
    list.

Method $\mathtt{check}(q)$ should not obtain a lock; instead add the
following line just before releasing the lock in `put` and `get`:

**assert** `check()`

$\mathtt{remove}(q, v)$ to that removes all occurrences of $v$, if any,
from queue $q$.

The test program in is a not thorough test program. Design and implement
a test program for . Make sure you *test* the test program by trying it
out against some buggy queue implementations.

Create a thread-safe sorted binary tree. Implement a module `bintree`
with methods

Add methods to the data structure in that report the size of the list,
the minimum value in the list, the maximum value in the list, and the
sum of the values in the list. Are they linearizable? If so, what are
their linearization points?

Create a thread-safe sorted binary tree. Implement a module `bintree`
with methods $\mathtt{BinTree}()$ to create a new binary tree,
$\mathtt{insert}(t, v)$ that inserts $v$ into tree $t$, and
$\mathtt{contains}(t, v)$ that checks if $v$ is in tree $t$. Use a
single lock per binary tree.

Create a binary tree that uses, instead of a single lock per tree, a
lock for each node in the tree.

