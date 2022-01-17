
# Deadlock 

When multiple threads are synchronizing access to shared resources, they
may end up in a *deadlock* situation where one or more of the threads
end up being blocked indefinitely because each is waiting for another to
give up a resource. The famous Dutch computer scientist Edsger
W. Dijkstra illustrated this using a scenario he called "Dining
Philosophers."

Imagine five philosopers sitting around a table, each with a plate of
food in front of them and a fork between every two plates. Each
philosopher requires two forks to eat. To start eating, a philosopher
first picks up the fork on the left, then the fork on the right. Each
philosopher likes to take breaks from eating to think for a while. To do
so, the philosopher puts down both forks. Each philosopher repeats this
procedure. Dijkstra had them repeating this for ever, but for the
purposes of this book, philosophers can---if they wish---leave the table
when they are not using any forks.

```python title="Diners.hny"
from synch import Lock, acquire, release
const N = 5
forks = [Lock(),] * N

def diner(which):
    let left, right = (which, (which + 1) % N):
        while choose({ False, True }):
            acquire(?forks[left])
            acquire(?forks[right])
            # dine
            release(?forks[left])
            release(?forks[right])
            # think
for i in {0..N–1}:
    spawn diner(i)
```

<figcaption>Figure 19.1 (<a href=https://harmony.cs.cornell.edu/code/Diners.hny>code/Diners.hny</a>): 
Dining Philosophers </figcaption>

Figure 19.1 implements the dining philosophers in Harmony, using a
thread for each philosopher and a lock for each fork. If you run it,
Harmony complains that the execution may not be able to terminate, with
all five threads being blocked trying to acquire the lock.

> -   Do you see what the problem is?
>
> -   Does it depend on `N`, the number of philosophers?
>
> -   Does it matter in what order the philosophers lay down their
>     forks?

There are four conditions that must hold for deadlock to occur:

1.  *Mutual Exclusion*: each resource can only be used by one thread at
    a time:

2.  *Hold and Wait*: each thread holds resources it already allocated
    while it waits for other resources that it needs;

3.  *No Preemption*: resources cannot be forcibly taken away from
    threads that allocated them;

4.  *Circular Wait*: there exists a directed circular chain of threads,
    each waiting to allocate a resource held by the next.

Preventing deadlock thus means preventing that one of these conditions
occurs. However, mutual exclusion is not easily prevented in general
(although, for some resources it is possible, as demonstrated in
[Chapter 25](nonblocking.md)). Havender proposed the following techniques that
avoid the remaining three conditions:

-   *No Hold and Wait*: a thread must request all resources it is going
    to need at the same time;

-   *Preemption*: if a thread is denied a request for a resource, it
    must release all resources that it has already acquired and start
    over;

-   *No Circular Wait*: define an ordering on all resources and allocate
    resources in a particular order.

```python title="DinersCV.hny"
import synch
const N = 5
mutex = synch.Lock()
forks = [False,] * N
conds = [synch.Condition(),] * N

def diner(which):
    let left, right = (which, (which + 1) % N):
        while choose({ False, True }):
            synch.acquire(?mutex)
            while forks[left] or forks[right]:
                if forks[left]:
                    synch.wait(?conds[left], ?mutex)
                if forks[right]:
                    synch.wait(?conds[right], ?mutex)
            assert not (forks[left] or forks[right])
            forks[left] = forks[right] = True
            synch.release(?mutex)
            # dine
            synch.acquire(?mutex)
            forks[left] = forks[right] = False
            synch.notify(?conds[left]);
            synch.notify(?conds[right])
            synch.release(?mutex)
            # think
for i in {0..N–1}:
    spawn diner(i)
```

<figcaption>Figure 19.2 (<a href=https://harmony.cs.cornell.edu/code/DinersCV.hny>code/DinersCV.hny</a>): 
Dining Philosophers that grab both forks at the same time
</figcaption>

To implement a *No Hold and Wait* solution, a philosopher would need a
way to lock both the left and right forks at the same time. Locks do not
have such an ability, and neither do semaphores. so we re-implement the
Dining Philosophers using condition variables that allow one to wait for
arbitrary application-specific conditions. Figure 19.2 demonstrates
how this might be done. We use a single mutex for the diners, and, for
each fork, a boolean and a condition variable. The boolean indicates if
the fork has been taken. Each diner waits if either the left or right
fork is already taken. But which condition variable to wait on? The code
demonstrates an important technique to use when waiting for multiple
conditions. The condition in the **while** statement is the negation of
the condition that the diner is waiting for and consists of two
disjuncts. Within the **while** statement, there is an **if** statement
for each disjunct. The code waits for either or both forks if necessary.
After that, it goes back to the top of the **while** loop.

A common mistake is to write the following code instead:


```python
while forks[left]:
    synch.wait(?conds[left], ?mutex)
while forks[right]:
    synch.wait(?conds[right], ?mutex)
```

> -   Can you see why this does not work? What can go wrong?
>
> -   Run it through Harmony in case you are not sure!

The *Preemption* approach suggested by Havender is to allow threads to
back out. While this could be done, this invariably leads to a busy
waiting solution where a thread keeps obtaining locks and releasing them
again until it finally is able to get all of them.

The *No Circular Waiting* approach is to prevent a cycle from forming,
with each thread waiting for the next thread on the cycle. We can do
this by establishing an ordering among the resources (in this case the
forks) and, when needing more than one resource, always acquiring them
in order. In the case of the philosopers, they could prevent deadlock by
always picking up the lower numbered fork before the higher numbered
fork, like so:


```python
if left < right:
    synch.acquire(?forks[left])
    synch.acquire(?forks[right])
else:
    synch.acquire(?forks[right])
    synch.acquire(?forks[left])
```

or like so:


```python
synch.acquire(?forks[min(left, right)])
synch.acquire(?forks[max(left, right)])
```

This completes all the Havender methods. There is, however, another
approach, which is sometimes called deadlock *avoidance* instead of
deadlock *prevention*. In the case of the Dining Philosophers, we want
to avoid the situation where each diner picks up a fork. If we can
prevent more than four diners from starting to eat at the same time,
then we can avoid the conditions for deadlock from ever happening.
Figure 19.3 demonstrates this concept. It uses a *counting
semaphore* to restrict the number of diners at any time to four. A
counting semaphore is like a binary semaphore, but can be acquired a
given number of times. It is supported by the `synch` module. The `P` or
"procure" operation acquires a counting semaphore. That is, it tries to
decrement the semaphore, blocking while the semaphore has a value of 0.
The `V` or "vacate" operation increments the semaphore.

```python title="DinersAvoid.hny"
from synch import *
const N = 5
forks = [Lock(),] * N
sema = Semaphore(N – 1) # can be procured up to N−1 times

def diner(which):
    let left, right = (which, (which + 1) % N):
        while choose({ False, True }):
            P(?sema) # procure counting semaphore
            acquire(?forks[left])
            acquire(?forks[right])
            # dine
            release(?forks[left])
            release(?forks[right])
            V(?sema) # vacate counting semaphore
            # think
for i in {0..N–1}:
    spawn diner(i)
```

<figcaption>Figure 19.3 (<a href=https://harmony.cs.cornell.edu/code/DinersAvoid.hny>code/DinersAvoid.hny</a>): Dining Philosophers that carefully avoid getting into a dead-lock scenario </figcaption>

This avoidance technique can be generalized using something called the
Banker's Algorithm, but it is outside the scope of this book.
The problem with these kinds of schemes is that one needs to know ahead
of time the set of threads and what the maximum number of resources is
that each thread wants to allocate, making them generally quite
impractical.


## Exercises 


**19.1** The solution in Figure 19.2 can be simplified by, instead of having
a condition variable per fork, having a condition variable per diner. It
uses the same number of condition variables, but you will not need to
have **if** statements nested inside the **while** loop waiting for the
forks. See if you can figure it out.

**19.2** Figure 19.4 shows an implementation of a bank with various accounts and transfers between
those accounts. Unfortunately, running the test reveals that it
sometimes leaves unterminated threads. Can you fix the problem?

**19.3** Add a method `total`() to the solution of the previous question that
computes the total over all balances. It needs to obtain a lock on all
accounts. Make sure that it cannot cause deadlock.

**19.4** Add an invariant that checks that the total of the balances never
changes. Note that the invariant only holds if none of the locks are
held.


```python title="bank.hny"
from synch import Lock, acquire, release
const MAX_BALANCE = 2
const N_ACCOUNTS = 2
const N_THREADS = 2
accounts = [ { .lock: Lock(), .balance: choose({0..MAX_BALANCE})}
                            for i in {1..N_ACCOUNTS} ]

def transfer(a1, a2, amount):
    acquire(?accounts[a1].lock)
    if amount  < = accounts[a1].balance:
        accounts[a1].balance –= amount
        acquire(?accounts[a2].lock)
        accounts[a2].balance += amount
        release(?accounts[a2].lock)
        result = True
    else:
        result = False
    release(?accounts[a1].lock)

def thread():
    let a1 = choose({0..N_ACCOUNTS–1})
    let a2 = choose({0..N_ACCOUNTS–1} – { a1 }):
        transfer(a1, a2, choose({1..MAX_BALANCE}))
for i in {1..N_THREADS}:
    spawn thread()
```

<figcaption>Figure 19.4 (<a href=https://harmony.cs.cornell.edu/code/bank.hny>code/bank.hny</a>): 
Bank accounts </figcaption>
