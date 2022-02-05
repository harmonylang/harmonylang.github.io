
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
item. However, the thread is not considered blocked because it is
changing the shared state by repeatedly acquiring and releasing the
lock. A process that is waiting for a condition without changing the
state (like in a spinlock) is *blocked*. A process that is waiting for a
condition while changing the state (such as repeatedly trying to dequeue
an item, which requires acquiring a lock) is *actively busy waiting*.

We would like to find a solution to *conditional waiting* so that a
thread blocks until the condition holds---or at least most of the time.
Before we do so, we will give two classic examples of synchronization
problems that involve conditional waiting: *reader/writer locks* and
*bounded buffers*.

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


```python title="RW.hny"
def RWlock():
    result = { .nreaders: 0, .nwriters: 0 }

def read_acquire(rw):
    atomically when rw->nwriters == 0:
        rw->nreaders += 1

def read_release(rw):
    atomically rw->nreaders -= 1

def write_acquire(rw):
    atomically when (rw->nreaders + rw->nwriters) == 0:
        rw->nwriters = 1

def write_release(rw):
    atomically rw->nwriters = 0
```

<figcaption>Figure 15.1 (<a href=https://harmony.cs.cornell.edu/code/RW.hny>code/RW.hny</a>): 
Specification of reader/writer locks </figcaption>


```python title="RWtest.hny"
import RW
const NOPS = 3
rw = RW.RWlock()

def thread():
    while choose({ False, True }):
        if choose({ "read", "write" }) == "read":
            RW.read_acquire(?rw)
            rcs: assert (countLabel(rcs) >= 1) and (countLabel(wcs) ==
0)
            RW.read_release(?rw)
        else: # write
            RW.write_acquire(?rw)
            wcs: assert (countLabel(rcs) == 0) and (countLabel(wcs) ==
1)
            RW.write_release(?rw)
for i in {1..NOPS}:
    spawn thread()
```

<figcaption>Figure 15.2 (<a href=https://harmony.cs.cornell.edu/code/RWtest.hny>code/RWtest.hny</a>): 
Test code for reader/writer locks </figcaption>

What we want is a special kind of lock that allows either (i) one writer
or (ii) one or more readers to acquire the lock. This is called a
*reader/writer lock*. A reader/writer lock is an object whose
abstract (and opaque) state contains two integer counters (see
Figure 15.1):

1.  *nreaders*: the number of readers

2.  *nwriters*: the number of writers

satisfying the following invariant:

-   $(\mathit{nreaders} \ge 0 \land \mathit{nwriters} = 0) \lor
        (\mathit{nreaders} = 0 \land 0 \le \mathit{nwriters} \le 1)$

There are four operations on a reader/writer lock *rw*:

-   `read_acquire`(*rw*): waits until *nwriters* = 0 and then increments
    *nreaders*;

-   `read_release`(*rw*): decrements *nreaders*;

-   `write_acquire`(*rw*): waits until *nreaders* = *nwriters* = 0 and
    then sets *nwriters* to 1;

-   `write_release`(*rw*): sets *nwriters* to 0.

Figure 15.2 shows how reader/writer locks operations may be tested.
Similar to ordinary locks, a thread is restricted in how it is allowed
to invoke these operations. In particular, a thread can only release a
reader/writer lock for reading if it acquired the lock for reading and
the same for writing.


```python title="RWcheat.hny"
import synch

def RWlock():
    result = synch.Lock()

def read_acquire(rw):
    synch.acquire(rw);

def read_release(rw):
    synch.release(rw);

def write_acquire(rw):
    synch.acquire(rw);

def write_release(rw):
    synch.release(rw);
```

<figcaption>Figure 15.3 (<a href=https://harmony.cs.cornell.edu/code/RWcheat.hny>code/RWcheat.hny</a>): 
\"Cheating\" reader/writer lock </figcaption>

A problem with this test is that it does not find a problem with an
implementation like the one in Figure 15.3. This implementation
implements a reader/writer lock as an ordinary lock, and thus lets only
one thread in the critical section at a time. In some sense, the
implementation is correct because it satisfies the requirements, but it
is clearly not a desirable implementation. For a case like this one, it
is better to compare behaviors between the specification and the
implementation.

```python title="RWbtest.hny"
import RW
const NOPS = 3
rw = RW.RWlock()

def thread(self):
    while choose({ False, True }):
        if choose({ "read", "write" }) == "read":
            print(self, "enter ra")
            RW.read_acquire(?rw)
            print(self, "exit ra")
            rcs: assert (countLabel(rcs) >= 1) and (countLabel(wcs) == 0)
            print(self, "enter rr")
            RW.read_release(?rw)
            print(self, "exit rr")
        else: # write
            print(self, "enter wa")
            RW.write_acquire(?rw)
            print(self, "exit wa")
            wcs: assert (countLabel(rcs) == 0) and (countLabel(wcs) == 1)
            print(self, "enter wr")
            RW.write_release(?rw)
            print(self, "enter wr")
for i in {1..NOPS}:
    spawn thread(i)
```

<figcaption>Figure 15.4 (<a href=https://harmony.cs.cornell.edu/code/RWbtest.hny>code/RWbtest.hny</a>): 
A behavioral test of reader/writer locks </figcaption>

Figure 15.4 is the same test as Figure 15.2 but prints
identifying information before and every lock operation. Now we can
compare behaviors as follows:

    $ harmony -o rw.hfa -o rwspec.png -cNOPS=2 code/RWbtest.hny
    $ harmony -B rw.hfa -o rwimpl.png -cNOPS=2 -m RW=RWcheat code/RWbtest.hny

The second command will print a warning that there are behaviors in the
specification that are not achieved by the implementation. We set `NOPS`
to 2 to make the behaviors relatively small and easier to compare. It is
now possible to compare the outputs in `rwspec.png` and `rwimpl.png` and
see what behaviors are allowed by the specification that are not allowed
by the implementation. (Harmony does not yet have a mechanism to do this
automatically.)

```python title="RWbusy.hny"
from synch import Lock, acquire, release

def RWlock():
    result = { .lock: Lock(), .nreaders: 0, .nwriters: 0 }

def read_acquire(rw):
    acquire(?rw->lock)
    while rw->nwriters > 0:
        release(?rw->lock)
        acquire(?rw->lock)
    rw->nreaders += 1
    release(?rw->lock)

def read_release(rw):
    acquire(?rw->lock)
    rw->nreaders -= 1
    release(?rw->lock)

def write_acquire(rw):
    acquire(?rw->lock)
    while (rw->nreaders + rw->nwriters) > 0:
        release(?rw->lock)
        acquire(?rw->lock)
    rw->nwriters = 1
    release(?rw->lock)

def write_release(rw):
    acquire(?rw->lock)
    rw->nwriters = 0
    release(?rw->lock)
```

<figcaption>Figure 15.5 (<a href=https://harmony.cs.cornell.edu/code/RWbusy.hny>code/RWbusy.hny</a>): 
Busy waiting reader/writer lock</figcaption>

Figure 15.5 illustrates an implementation of a reader/writer lock
that uses active busy waiting.  This is an undesirable solution, as it wastes
CPU cycles.  Harmony complains about this solution.

## Bounded Buffer

```python title="boundedbuffer.hny"
import list

def BoundedBuffer(size):
    result = { .buffer: [ ], .size: size }

def put(bb, v):
    atomically when len(bb->buffer) < bb->size:
        bb->buffer = list.append(bb->buffer, v)

def get(bb):
    atomically when bb->buffer != [ ]:
        result = list.head(bb->buffer)
        bb->buffer = list.tail(bb->buffer)
```

<figcaption>Figure 15.6 (<a href=https://harmony.cs.cornell.edu/code/boundedbuffer.hny>code/boundedbuffer.hny</a>): 
Bounded buffer specification </figcaption>

A *bounded buffer* is a queue with the usual `put/get` interface, but
implemented using a buffer of a certain maximum length. If the buffer is
full, an enqueuer must wait; if the buffer is empty, a dequeuer must
wait. Figure 15.6 specifies a bounded buffer. It is similar to
the implementation in Figure 11.1(b) but adds checking for bounds.
Coming up with a good implementation is known as the "Producer/Consumer
Problem" and was proposed by Dijkstra. Multiple producers and
multiple consumers may all share the same bounded buffer.

The producer/consumer pattern is common. Threads may be arranged in
*pipelines*, where each upstream thread is a producer and each
downstream thread is a consumer. Or threads may be arranged in a
manager/worker pattern, with a manager producing jobs and workers
consuming and executing them in parallel. Or, in the client/server
model, some thread may act as a *server* that clients can send requests
to and receive responses from. In that case, there is a bounded buffer
for each client/server pair. Clients produce requests and consume
responses, while the server consumes requests and produces responses.

Unlike an ordinary queue, where queues can grow arbitrarily, bounded
buffers provide *flow control*: if the consumer runs faster than the
producer (or producers), it will automatically block until there are new
requests. Similarly, if the producers add requests at a rate that is
higher than the consumers can deal with, the producers are blocked.
While a buffer of size 1 already provides those properties, a larger
buffer is able to deal with short spikes without blocking anybody.
