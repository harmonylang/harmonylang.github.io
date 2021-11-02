
# Debugging 


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def Queue():
    result = { .next: None, .value: None, .lock: Lock() }

def put(q, v):
    var nq = q
    let node = malloc({ .next: None, .value: v, .lock: Lock() }):
        while nq != None:
            acquire(?nq->lock)
            let n = nq->next:
                if n == None:
                    nq->next = node
                release(?nq->lock)
                nq = n

def get(q):
    acquire(?q->lock)
    if q->next == None:
        result = None
    else:
        let node = q->next:
            q->next = node->next
            result = node->value
            free(node)
    release(?q->lock)
```




So you wrote a Harmony program and Harmony reports a bug. Often you may
just be able to figure it out by staring at the code and going through
some easy scenarios, but what if you don't? The output of Harmony can be
helpful in that case.

contains an attempt at a queue implementation where the queue is
implemented by a linked list, with the first node being a `dummy` node
to prevent data races. Each node in the list contains a lock. The
`put`() method walks the list until it gets to the last node, each time
acquiring the lock to access the node's fields. When `put`() gets to the
last node in the list, it appends a new one. The `get`() method locks
the first (dummy) node, removes the second from the list and frees it.
The method returns the value from the removed node.

Let us run the code through some of the test programs in the last
chapter. Harmony does not detect any issues with the sequential test in
. (Run this using the `-m` flag like this:
`harmony -m queue=queuebug code/qtestseq.hny`) The concurrent `put` test
of as well as the concurrent `get` test of also find no problems.
However, when we run the new queue code through the test in , Harmony
finds a problem.

shows the Harmony output of running the test in against the queue code
in . There is quite a bit of information in the Harmony output, and it's
important to learn to navigate through it. Let's start with looking at
the red text. Harmony found a safety violation (something bad happened
during one of the possible executions), and in particular `putter`(1)
(thread T2) was trying to dereference `alloc`.*pool*\[0\].`lock` in turn
5.

The `alloc` module maintains a shared array *pool* that it uses for
dynamic allocation. Apparently `putter`(1) tried to access *pool*\[0\],
but it does not exist, meaning that either it was not yet allocated, or
it had been freed since it was allocated. When we look at the top half
of the figure, we see that in fact `putter`(0) (T1) allocated
*pool*\[0\] in turn 2, while `getter`() (T4) released it in turn 4.

So how did we get there? We can start by single stepping through the
actions of `putter`(0) by clicking on its first block. By hitting return
repeatedly, we can go through the lines of code that it is executing.
Doing so, we can see that it allocates *pool*\[0\] and uses that as the
node to contain value 0 and add this node to the queue *qtest*. At the
end of its turn, `putter`(0) has just finished `put`(0). Looking at the
state in the top right, everything looks good. The first node (*testq*)
points to the allocated node with the value 0 in it, and its `next`
pointer is **None**. The locks on both nodes are released. So far so
good.

Next `putter`(1) (thread T2) takes a turn. It gets to line 10 in where
it's trying to acquire $q$->`lock`. If we look at the bottom
right, we see that $q$ points to *pool*\[0\], the node that has value 0
in it. Again, so far so good.

But before `putter`(1) obtains the lock on *pool*\[0\], `getter`()
(thread T4) starts running. `getter`() acquires the lock on *qtest*,
which still points to *pool*\[0\]. `getter` then extracts the value from
*pool*\[0\] and then releases it. At this point *pool*\[0\] no longer
exists, but then `putter`(1) starts running again from where it left
off. It was about to acquire the lock on *pool*\[0\], but now that node
no longer exists.

To fix the code without changing the data structure, we can use
hand-over-hand locking (). shows an implementation that uses
hand-over-hand locking both for `put`() and for `get`(). It passes all
tests.


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def Queue():
    result = { .next: None, .value: None, .lock: Lock() }

def put(q, v):
    var nq = q
    let node = malloc({ .next: None, .value: v, .lock: Lock() }):
        acquire(?nq->lock)
        var n = nq->next
        while n != None:
            acquire(?n->lock)
            release(?nq->lock)
            nq = n
            n = n->next
        nq->next = node
        release(?nq->lock)

def get(q):
    acquire(?q->lock)
    if q->next == None:
        result = None
    else:
        let node = q->next:
            acquire(?node->lock)
            q->next = node->next
            result = node->value
            release(?node->lock)
            free(node)
    release(?q->lock)
```
