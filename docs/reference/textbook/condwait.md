
# Conditional Waiting 

Critical sections enable multiple threads to easily share data
structures whose modification requires multiple steps. A critical
section only allows one thread to execute the code of the critical
section at a time. Therefore, when a thread arrives at a critical
section, the thread blocks until there is no other thread in the
critical section.

Sometimes it is useful for a thread to block waiting for additional
conditions. For example, when dequeuing from an empty shared queue, it
may be useful for the thread to block until the queue is non-empty
instead of returning an error. The alternative would be *busy waiting*
(aka *spin-waiting*), where the thread repeatedly tries to dequeue an
item until it is successful. Doing so wastes CPU cycles and adds
contention to queue access. A thread that is busy waiting until the
queue is non-empty cannot make progress until another thread enqueues an
item. However, the thread is not considered *blocked* because it is
changing the shared state by repeatedly acquiring and releasing the
lock. We distinguish *passive busy waiting* and *active busy waiting*. A
process that is waiting for a condition without changing the state (like
in a spinlock) is passively busy waiting. A process that is waiting for
a condition while changing the state (such as repeatedly trying to
dequeue an item, which requires acquiring a lock) is actively busy
waiting.

We would like to find a solution to *conditional waiting* so that a
thread blocks until the condition holds---or at least most of the time.
Before we do so, we will give two classic examples of synchronization
problems that involve conditional waiting: *reader/writer locks* and
*bounded buffers*.


```python
import RW
rw = RW.RWlock()

def thread():
    while choose({ False, True }):
        if choose({ .read, .write }) == .read:
            RW.read_acquire(?rw)
            @rcs: assert countLabel(wcs) == 0
            RW.read_release(?rw)
        else:                       # .write
            RW.write_acquire(?rw)
            @wcs: assert (countLabel(wcs) == 1) and (countLabel(rcs) == 0)
            RW.write_release(?rw)
for i in {1..3}:
    spawn thread()
```

## Reader/Writer Locks

Locks are useful when accessing a shared data structure. By preventing
more than one thread from accessing the data structure at the same time,
conflicting accesses are avoided. However, not all concurrent accesses
conflict, and opportunities for concurrency may be lost, hurting
performance. One important case is when multiple threads are simply
reading the data structure. In many applications, reads are the majority
of all accesses, and read operations do not conflict with one another.
Allowing reads to proceed concurrently can significantly improve
performance.

What we want is a special kind of lock that allows either (i) one writer
or (ii) one or more readers to acquire the lock. This is called a
*reader/writer lock*. A reader/writer lock is an object whose
abstract (and opaque) state contains two integer counters:

1.  *nreaders*: the number of readers

2.  *nwriters*: the number of writers

satisfying the following invariant:

-   $(\mathit{nreaders} \ge 0 \land \mathit{nwriters} = 0) \lor
        (\mathit{nreaders} = 0 \land 0 \le \mathit{nwriters} \le 1)$

There are four operations on a reader/writer lock *rw*:

-   `read_acquire`(*rw*): waits until $\mathit{nwriters} = 0$ and then
    increments *nreaders*;

-   `read_release`(*rw*): decrements $\mathit{nreaders}$;

-   `write_acquire`(*rw*): waits until
    $\mathit{nreaders} = \mathit{nwriters} = 0$ and then sets *nwriters*
    to 1;

-   `write_release`(*rw*): sets $\mathit{nwriters}$ to 0.

shows how reader/writer locks operations may be tested. Similar to
ordinary locks, a thread is restricted in how it is allowed to invoke
these operations. In particular, a thread can only release a
reader/writer lock for reading if it acquired it for reading and the
same for writing. Moreover, a thread is only allowed the acquire a
reader/writer lock once.

## Bounded Buffer

A *bounded buffer* (aka *ring buffer*) is a queue with the usual
`put/get` interface, but implemented using a circular buffer of a
certain length and two pointers: the *tail* points where new items are
enqueued and the *head* points where items are dequeued. If the buffer
is full, the enqueuer must wait; if the buffer is empty, the dequeuer
must wait. This problem is known as the "Producer/Consumer Problem" and
was proposed by Dijkstra. Multiple producers and multiple
consumers may all share the same bounded buffer.

The producer/consumer pattern is common. Threads may be arranged in
*pipelines*, where each upstream thread is a producer and each
downstream thread is a consumer. Or threads may be arranged in a
manager/worker pattern, with a manager producing jobs and workers
consuming and executing them in parallel. Or, in the client/server
model, some thread may act as a *server* that clients can send requests
to and receive responses from. In that case, there is a bounded buffer
for each client/server pair. Clients produce requests and consume
responses, while the server consumes requests and produces responses.
