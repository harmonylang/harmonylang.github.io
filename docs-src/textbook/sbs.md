
# Split Binary Semaphores 

The Split Binary Semaphore (SBS) approach is a general technique for
implementing conditional waiting. It was originally proposed by Tony
Hoare and popularized by Edsger Dijkstra. A *binary semaphore*
is a generalization of a lock. While a lock is always initialized in the
released state, a binary semaphore---if so desired---can be initialized
in the acquired state. SBS is an extension of a critical section that is
protected by a lock. If there are $n$ *waiting conditions*, then SBS
uses $n+1$ binary semaphores to protect the critical section. An
ordinary critical section has no waiting conditions and therefore uses
just one binary semaphore (because $n = 0$). But, for example, a bounded
buffer has two waiting conditions:

1.  consumers waiting for the buffer to be non-empty;

2.  producers waiting for an empty slot in the buffer.

So, it will require 3 binary semaphores if the SBS technique is applied.

Think of each of these binary semaphores as a gate that a thread must go
through in order to enter the critical section. A gate is either open or
closed. Initially, exactly one gate, the main gate, is open. Each of the
other gates, the *waiting gates*, is associated with a waiting
condition. When a gate is open, one thread can enter the critical
section, closing the gate behind it.

When leaving the critical section, the thread must open exactly one of
the gates, but it does not have to be the gate that it used to enter the
critical section. In particular, when a thread leaves the critical
section, it should check for each waiting gate if its waiting condition
holds and if there are threads trying to get through the gate. If there
is such a gate, then it must select one and open that gate. If there is
no such gate, then it must open the main gate.

Finally, if a thread is executing in the critical section and needs to
wait for a particular condition, then it leaves the critical section and
waits for the gate associated with that condition to open.

The following invariants hold:

-   At any time, at most one gate is open;

-   If some gate is open, then no thread is in the critical section.
    Equivalently, if some thread is in the critical section, then all
    gates are closed;

-   At any time, at most one thread is in the critical section.

The main gate is implemented by a binary semaphore, initialized in the
released state (signifying that the gate is open). The waiting gates
each consist of a pair: a counter that counts how many threads are
waiting behind the gate and a binary semaphore initialized in the
acquired state (signifying that the gate is closed).


```python title="RWsbs.hny"
from synch import BinSema, acquire, release

def RWlock():
    result = {
            .nreaders: 0, .nwriters: 0, .mutex: BinSema(False),
            .r_gate: { .sema: BinSema(True), .count: 0 },
            .w_gate: { .sema: BinSema(True), .count: 0 }
        }

def release_one(rw):
    if (rw->nwriters == 0) and (rw->r_gate.count > 0):
        release(?rw->r_gate.sema)
    elif ((rw->nreaders + rw->nwriters) == 0) and (rw->w_gate.count >
0):
        release(?rw->w_gate.sema)
    else:
        release(?rw->mutex)

def read_acquire(rw):
    acquire(?rw->mutex)
    if rw->nwriters > 0:
        rw->r_gate.count += 1; release_one(rw)
        acquire(?rw->r_gate.sema); rw->r_gate.count -= 1
    rw->nreaders += 1
    release_one(rw)

def read_release(rw):
    acquire(?rw->mutex); rw->nreaders -= 1; release_one(rw)

def write_acquire(rw):
    acquire(?rw->mutex)
    if (rw->nreaders + rw->nwriters) > 0:
        rw->w_gate.count += 1; release_one(rw)
        acquire(?rw->w_gate.sema); rw->w_gate.count -= 1
    rw->nwriters += 1
    release_one(rw)

def write_release(rw):
    acquire(?rw->mutex); rw->nwriters -= 1; release_one(rw)
```

<figcaption>Figure 16.1 (<a href=https://harmony.cs.cornell.edu/code/RWsbs.hny>code/RWsbs.hny</a>): 
Reader/Writer Lock using Split Binary Semaphores
</figcaption>

We will illustrate the technique using the reader/writer problem.
Figure 16.1 shows code. The first step is to enumerate all
waiting conditions. In the case of the reader/writer problem, there are
two: a thread that wants to read may have to wait for a writer to leave
the critical section, while a thread that wants to write may have to
wait until all readers have left the critical section or until a writer
has left. The state of a reader/writer lock thus consists of the
following:

-   *nreaders*: the number of readers in the critical section;

-   *nwriters*: the number of writers in the critical section (0 or 1);

-   *mutex*: the main gate binary semaphore;

-   *r_gate*: the waiting gate used by readers, consisting of a binary
    semaphore and the number of readers waiting to enter;

-   *w_gate*: the waiting gate used by writers, similar to the readers'
    gate.

Each of the `read_acquire`, `read_release`, `write_acquire`, and
`write_release` methods must maintain this state. First they have to
acquire the *mutex* (i.e., enter the main gate). After acquiring the
*mutex*, `read_acquire` and `write_acquire` each must check to see if
the thread has to wait. If so, it increments the count associated with
its respective gate, opens a gate (using method `release_one`), and then
blocks until its waiting gate opens up.

`release_one`() is the function that a thread uses when leaving the
critical section. It must check to see if there is a waiting gate that
has threads waiting behind it and whose condition is met. If so, it
selects one and opens that gate. In the given code, `release_one`()
first checks the readers' gate and then the writers' gate, but the other
way around works as well. If neither waiting gate qualifies, then
`release_one`() has to open the main gate (i.e., release *mutex*).

Let us examine `read_acquire` more carefully. First, the method acquires
*mutex*. Then, in the case that the thread finds that there is a writer
in the critical section ($\mathit{nwriters > 0}$), it increments the
counter associated with the readers' gate, leaves the critical section
(`release_one`), and then tries to acquire the binary semaphore
associated with the waiting gate. This causes the thread to block until
some other thread opens that gate.

Now consider the case where there is a writer in the critical section
and there are two readers waiting. Let us see what happens when the
writer calls `write_release`:

1.  After acquiring *mutex*, the writer decrements *nwriters*, which
    must be 1 at this time, and thus becomes 0.

2.  It then calls `release_one`(). `release_one`() finds that there are
    no writers in the critical section and there are two readers
    waiting. It therefore releases not *mutex* but the readers' gate's
    binary semaphore.

3.  One of the waiting readers can now re-enter the critical section.
    When it does, the reader decrements the gate's counter (from 2 to 1)
    and increments *nreaders* (from 0 to 1). The reader finally calls
    `release_one`().

4.  Again, `release_one`() finds that there are no writers and that
    there are readers waiting, so again it releases the readers'
    semaphore.

5.  The second reader can now enter the critical section. It decrements
    the gate's count from 1 to 0 and increments *nreaders* from 1 to 2.

6.  Finally, the second reader calls `release_one`(). This time
    `release_one`() does not find any threads waiting, and so it
    releases *mutex*. There are now two reader threads that are holding
    the reader/writer lock.

## Exercises 


**16.1** Several of the calls to `release_one`() in Figure 16.1 can be
replaced by simply releasing *mutex*. Which ones?

**16.2** Optimize your solutions to Exercise 11.1 to use reader/writer locks.

**16.3** Implement a solution to the producer/consumer problem using split binary semaphores.

**16.4** Using busy waiting, implement a "bound lock" that allows up to `M` threads to
acquire it at the same time.[^3] A bound lock with `M = 1` is an
ordinary lock. You should define a constant `M` and two methods:
`acquire_bound_lock`() and `release_bound_lock`(). (Bound locks are
useful for situations where too many threads working at the same time
might exhaust some resource such as a cache.)

**16.5** Write a test program for your bound lock that checks that no more than
`M` threads can acquire the bound lock.

**16.6** Write a test program for bound locks that checks that up to `M` threads
can acquire the bound lock at the same time.

```python title="gpu.hny"
const N = 10
availGPUs = {1..N}

def gpuAlloc():
    result = choose(availGPUs)
    availGPUs -= { result }

def gpuRelease(gpu):
    availGPUs |= { gpu }
```

<figcaption>Figure 16.2 (<a href=https://harmony.cs.cornell.edu/code/gpu.hny>code/gpu.hny</a>): 
A thread-unsafe GPU allocator </figcaption>

**16.7** Implement a thread-safe *GPU allocator* by modifying Figure 16.2. There are `N` GPUs identified by
the numbers 1 through `N`. Method `gpuAlloc`() returns the identifier of
an available GPU, blocking if there is currently no GPU available.
Method `gpuRelease`(*gpu*) releases the given GPU. It never needs to
block.

**16.8** With reader/writer locks, concurrency can be improved if a thread
*downgrades* its write lock to a read lock when its done writing but not
done reading. Add a *downgrade* method to the code in
Figure 16.1. (Similarly, you may want to try to implement an
*upgrade* of a read lock to a write lock. Why is this problematic?)

**16.9** Cornell’s campus features some one-lane bridges. On a one-lane bridge, cars can only go
in one direction at a time. Consider northbound and southbound cars
wanting to cross a one-lane bridge. The bridge allows arbitrary many
cars, as long as they're going in the same direction. Implement a lock
that observes this requirement using SBS. Write methods `OLBlock()` to
create a new "one lane bridge" lock, `nb_enter`() that a car must invoke
before going northbound on the bridge and `nb_leave`() that the car must
invoke after leaving the bridge. Similarly write `sb_enter`() and
`sb_leave`() for southbound cars.

**16.10** Extend the solution to Exercise 16.9 by implementing the requirement
that at most $n$ cars are allowed on the bridge. Add $n$ as an argument
to `OLBlock`.


