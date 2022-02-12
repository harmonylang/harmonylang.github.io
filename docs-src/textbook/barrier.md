
# Barrier Synchronization 

Barrier synchronization is a problem that comes up in high-performance
parallel computing. The Harmony model checker uses it. A barrier is
almost the opposite of a critical section: the intention is to get a
group of threads to run some code at the same time, instead of having
them execute it one at a time. More precisely, with barrier
synchronization, the threads execute in rounds. Between each round,
there is a so-called *barrier* where threads wait until all threads have
completed the previous round and reached the barrier---before they start
the next round. For example, in an iterative matrix algorithm, the
matrix may be cut up into fragments. During a round, the threads run
concurrently, one for each fragment. The next round is not allowed to
start until all threads have completed processing their fragment.

A barrier is used as follows:

-   *b* = `Barrier`(*n*): initialize a barrier *b* for a collection of
    *n* threads;

-   `bwait`(?*b*): wait until all threads have reached the barrier

```python title="barriertest.hny"
--8<-- "barriertest.hny"
```

<figcaption>Figure 21.1 (<a href=https://harmony.cs.cornell.edu/code/barriertest.hny>code/barriertest.hny</a>): 
Test program for Figure 21.2 </figcaption>

Figure 21.1 is a test program for barriers. It uses an integer
array *round* with one entry per thread. Each thread, in a loop, waits
for all threads to get to the barrier before incrementing its round
number. If the barrier works as advertised, two threads should never be
more than one round apart.

When implementing a barrier, a complication to worry about is that a
barrier can be used over and over again. If this were not the case, then
a solution based on a lock, a condition variable, and a counter
initialized to the number of threads could be used. The threads would
decrement the counter and wait on the condition variable until the
counter reaches 0.

```python title="barrier.hny"
--8<-- "barrier.hny"
```

<figcaption>Figure 21.2 (<a href=https://harmony.cs.cornell.edu/code/barrier.hny>code/barrier.hny</a>): 
Barrier implementation </figcaption>

Figure 21.2 shows how one might implement a reusable barrier.
Besides a counter .*left* that counts how many threads still have to
reach the barrier, it uses a counter .*cycle* that is incremented after
each use of the barrier---to deal with the complication above. The last
thread that reaches the barrier restores .*left* to the number of
threads (.*required*) and increments the cycle counter. The other
threads are waiting for the cycle counter to be incremented. The cycle
counter is allowed to wrap around---in fact, a single bit suffices for
the counter.

```python title="barriertest2.hny"
--8<-- "barriertest2.hny"
```

<figcaption>Figure 21.3 (<a href=https://harmony.cs.cornell.edu/code/barriertest2.hny>code/barriertest2.hny</a>): 
Demonstrating the double-barrier pattern </figcaption>

A common design pattern with barriers in parallel programs, demonstrated
in Figure 21.3, is to use the barrier twice in each round.
Before a round starts, one of the threads---let's call it the
coordinator---sets up the work that needs to be done while the other
threads wait. Then all threads do the work and go on until they reach a
second barrier. The second barrier is used so the coordinator can wait
for all threads to be done before setting up the work for the next
round.

## Exercises 


**21.1** Implement barrier synchronization for `N` threads with just three binary
semaphores. Busy waiting is not allowed. Can you implement barrier
synchronization with two binary semaphores? (As always, the Little Book
of Semaphores is a good resource for solving synchronization
problems with semaphores. Look for the *double turnstile* solution.)

**21.2** Imagine a pool hall with `N` tables. A table is *full* from the time
there are two players until both players have left. When someone
arrives, they can join a table that is not full, preferably one that has
a player ready to start playing. Implement a simulation of such a pool
hall.

