
# Barrier Synchronization 


```python
from synch import Queue, put, get
const NTHREADS = 3
const NROUNDS = 4
sequential round
round = [0,] * NTHREADS
q = [Queue(),] * NTHREADS

def thread(self):
    for r in {1..NROUNDS}:
        for i in {0..NTHREADS–1} where i != self:
            put(?q[i], None)
        for i in {0..NTHREADS–1} where i != self:
            get(?q[self])
        round[self] += 1
        assert (max(round) – min(round))  < = 1
for i in {0..NTHREADS–1}:
    spawn thread(i)
```

Barrier synchronization is a problem that comes up in high-performance
parallel computing. It is used, among others, for scalable simulation. A
barrier is almost the opposite of a critical section: the intention is
to get a group of threads to run some code at the same time, instead of
having them execute it one at a time. More precisely, with barrier
synchronization the threads execute in rounds. Between each round there
is a so-called *barrier* where threads wait until all threads have
completed the previous round, before they start the next one. For
example, in an iterative matrix algorithm, the matrix may be cut up into
fragments. During a round, the threads run concurrently, one for each
fragment. The next round is not allowed to start until all threads have
completed processing their fragment.

Blocking queues work well for implementing barrier synchronization.
shows an example. There is a queue for each of the `N` threads. Before
thread $i$ enters a round, it first sends a message to every other
thread and then waits until it receives a message from every other
thread. In this simple case, each message contains `None`, but in
practice useful information may be exchanged between the threads.

The *round* array is kept to check the correctness of this approach.
Each thread increments its entry every time it enters a round. If the
algorithm is correct, it can never be that two threads are more than one
round apart.


```python
from synch import *

def Barrier(limit):
    result = {
        .limit: limit, .stage: 0, .mutex: Lock(),
        .empty: Condition(), .full: Condition()
    }

def enter(b):
    acquire(?b->mutex)
    while b->stage  > = b->limit:     # wait for car to empty out
        wait(?b->empty, ?b->mutex)
    b->stage += 1
    if b->stage < b->limit:         # wait for car to fill up
        while b->stage < b->limit:
            wait(?b->full, ?b->mutex)
    else:                             
        notifyAll(?b->full)         # car is full and ready to go
    release(?b->mutex)

def exit(b):
    acquire(?b->mutex)
    assert b->limit  < = b->stage < (2 * b->limit)
    b->stage += 1
    if b->stage == (2 * b->limit):  # everybody left
        b->stage = 0
        notifyAll(?b->empty)        # let next group in
    release(?b->mutex)
```


```python
import barrier
const NROUNDS = 3
const NTHREADS = 3
barr = barrier.Barrier(NTHREADS)
sequential round
round = [None,] * NTHREADS

def thread(self):
    for r in {0..NROUNDS–1}:
        barrier.enter(?barr)
        round[self] = r
        assert { x for x in round where x != None } == { r }
        round[self] = None
        barrier.exit(?barr)
for i in {0..NTHREADS–1}:
    spawn thread(i)
```

More generally, barrier synchronization can be abstracted as follows. We
want to create a `Barrier`$(n)$ object, with operations `enter()` and
`exit()`. It is helpful to use a roller coaster car with $n$ seats as a
metaphor:

-   the car cannot contain more than $n$ people;

-   the car won't take off until $n$ people are in the car;

-   no new people can enter the car until all $n$ people have left it.

Notice there are two different waiting conditions:

1.  waiting for the car to empty out;

2.  waiting for the car to fill up.

But this poses a complication. Suppose, for example, that there are two
seats in the car, and there is one person in the car. Does that mean
that the car is not yet full, or not yet empty? We have to distinguish
those situations. To this end, it is useful to think of the car as going
through $2 \cdot n$ stages:

-   Stage 0: the car is empty;

-   Stage $1 ... n-1$: the car is filling up;

-   Stage $n$: the car is full;

-   Stage $n+1 ... 2n - 1$: the car is emptying out.

shows code that implements barrier synchronization using these stages.
Method `enter`() has two `wait` loops, one for each waiting condition.
This is sometimes called *double turnstile*. Each loop uses a different
condition variable. The first loop waits until the car has emptied out,
while the second waits for the car to fill up. is a test program. The
threads check that all threads within the barrier are in the same round.

## Exercises 


Implement barrier synchronization for `N` threads with just three binary
semaphores. Busy waiting is not allowed. Can you implement barrier
synchronization with two binary semaphores? (As always, the Little Book
of Semaphores is a good resource for solving synchronization
problems with semaphores. Look for the *double turnstile* solution.)

Imagine a pool hall with `N` tables. A table is *full* from the time
there are two players until both players have left. When someone
arrives, they can join a table that is not full, preferably one that has
a player ready to start playing. Implement a simulation of such a pool
hall.

