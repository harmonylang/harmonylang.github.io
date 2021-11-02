
# Lock Implementations 


```python
def test_and_set(s):
    atomically:
        result = !s
        !s = True

def Lock():
    result = False

def acquire(lk):
    while test_and_set(lk):
        pass

def release(lk):
    atomically !s = False
```


```python
const MAX_THREADS = 8

def fetch_and_increment(p):
    atomically:
        result = !p
        !p = (!p + 1) % MAX_THREADS

def Lock():
    result = { .counter: 0, .dispenser: 0 }

def acquire(lk):
    let my_ticket = fetch_and_increment(?lk->dispenser):
        atomically await lk->counter == my_ticket

def release(lk):
    let next = lk->counter + 1:
        atomically lk->counter = next
```

Locks are probably the most prevalent and basic form of synchronization
in concurrent programs. Typically, whenever you have a shared data
structure, you want to protect the data structure with a lock and
acquire the lock before access and release it immediately afterward. In
other words, you want the access to the data structure to be a critical
section. That way, when a thread makes modifications to the data
structure that take multiple steps, other threads will not see the
intermediate inconsistent states of the data structure.

When there is a bug in a program because some code omitted obtaining a
lock before accessing a shared data structure, that is known as a *data
race*. More precisely, a data race happens when there is a state in
which multiple threads are trying to access the same variable, and at
least one of those accesses updates the variable. In many environments,
including C and Java programs, the behavior of concurrent load and store
operations have tricky or even undefined semantics. One should therefore
avoid data races, which is why Harmony reports them even though Harmony
has sequentially consistent memory.

Harmony does not report data races in two cases. First, using the
**sequential** statement, you can specify that concurrent access to the
specified variables is intended. Second, if the accesses are within an
atomic statement block, then they are not considered part of a data
race.

In we have shown a lock implementation based on a shared variable and a
private variable for each thread. The private variables themselves are
actually implemented as shared variables, but they are accessed only by
their respective threads. A thread usually does not keep explicit track
of whether it has a lock or not, because it is implied by the control
flow of the program---a thread implicitly *knows* that when it is
executing in a critical section it has the lock. There is no need to
keep *private* as a shared variable---we only did so to be able to show
and check the invariants. shows a more straightforward implementation of
a spinlock. The lock is also cleared in an atomic statement to prevent a
data race. This approach is general for any number of threads.

You can test the spinlock with the program in using the command
`harmony -m synch=taslock code/cssynch.hny`. The `-m` flag tells Harmony
to use the `taslock.hny` file rather than the standard `synch` module
(which only contains a specification of the lock methods).

The spinlock implementation suffers potentially from *starvation*: an
unlucky thread may never be able to get the lock while other threads
successfully acquire the lock one after another. It could even happen
with just two threads: one thread might successfully acquire the lock
repeatedly in a loop, while another thread is never lucky enough the
acquire the thread in between. will talk more about starvation and how
to prevent it.

A *ticket lock* ( is an implementation of a lock that prevents
starvation using an atomic *fetch-and-increment* operator. It is
inspired by European bakeries. A European bakery has a clearly displayed
counter (usually just two digits) and a ticket dispenser. Tickets are
numbered 0 through 99 and repeat over and over again (in the case of a
two digit counter). When a customer walks into the bakery, they draw a
number from the dispenser and wait until their number comes up. Every
time a customer has been helped, the counter is incremented. (Note that
this only works if there can be no more than 100 customers in the bakery
at a time.)

similarly uses two variables for a lock, *counter* and *dispenser*. When
a thread acquires the lock, it fetches the current dispenser value and
increments it modulo `MAX_THREADS`, all in one atomic operation. In
practice, `MAX_THREADS` would be a number like $2^32$ or $2^64$, but
since the Harmony model checker checks every possible state, limiting it
to a small number such as done here will significantly reduce the time
to model check a Harmony program. Plus it is easier to check that it
fails when you run it with more than `MAX_THREADS` threads. You can test
the implementation using the command
`harmony -m synch=ticket code/cssynch.hny`. To see it fail, try
`harmony -c NTHREADS=10 -m synch=ticket code/cssynch.hny`.

We now turn to a radically different way of implementing locks, one that
is commonly provided by operating systems to user processes. We call a
thread *blocked* if a thread cannot change the state or terminate unless
another thread changes the state first. A thread trying to acquire a
lock held by another thread is a good example of a thread being blocked.
The only way forward is if the other thread releases the lock. A thread
that is in an infinite loop is also considered blocked.


```python
import list

def Lock():
    result = { .acquired: False, .suspended: [ ] }

def acquire(lk):
    atomically:
        if lk->acquired:
            stop lk->suspended[len lk->suspended]
            assert lk->acquired
        else:
            lk->acquired = True

def release(lk):
    atomically:
        assert lk->acquired
        if lk->suspended == [ ]:
            lk->acquired = False
        else:
            go (list.head(lk->suspended)) ()
            lk->suspended = list.tail(lk->suspended)
```

In most operating systems, threads are virtual (as opposed to "raw CPU
cores") and can be suspended until some condition changes. For example,
a thread that is trying to acquire a lock can be suspended until the
lock is available. In Harmony, a thread can suspend itself and save its
context (state) in a shared variable. Recall that the context of a
thread contains its program counter, stack, and registers. A context is
a regular (if complex) Harmony value. The syntax of the expression that
a thread executes to suspend itself is as follows:

**stop** $s$

This causes the context of the thread to be saved in $s$ and the thread
to be no longer running. Another thread can revive the thread using the
**go** statement:

**go** $C$ $R$;

Here $C$ is a context and $R$ is a Harmony value. It causes a thread
with context $C$ to be added to the state that has just executed the
**stop** expression. The **stop** expression returns the value $R$.

shows the lock interface using suspension. It is implemented as follows:

-   A lock maintains both a boolean indicating whether the lock is
    currently acquired and a list of contexts of threads that want to
    acquire the lock.

-   `acquire`() acquires the lock if available and suspends the invoking
    thread if not. In the latter case, the context of the thread is
    added to the end of the list of contexts. Note that **stop** is
    called within an atomic statement block---this is the only exception
    to such an atomic statement block running to completion. While the
    thread is running no other threads can run, but when the thread
    suspends itself other threads can run.

-   `release`() checks to see if any threads are waiting to acquire the
    lock. If so, it uses the `head` and `tail` methods from the `list`
    module (see ) to resume the first thread that got suspended and to
    remove its context from the list.

Selecting the first thread is a design choice. Another implementation
could have picked the last one, and yet another implementation could
have used `choose` to pick an arbitrary one. Selecting the first is a
common choice in lock implementations as it prevents starvation.

You will find that using the *implementation* of a lock instead of the
*specification* of a lock (in the `synch` module) often leads to the
model checker searching a significantly larger state space. Thus it
makes sense to model check larger programs in a modular fashion: model
check one module implementation at a time, using specifications for the
other modules.

## Exercises 


Run using (i) `synch` and (ii) `synchS`. Report how many states were
explored by Harmony for each module.

variables $x$ (initially 0) and $y$ (initially 100) that can be accessed
through methods `setX` and `getXY`. An application invariant is that
`getXY` should return a pair that sums to 100. Add the necessary
synchronization code.

`tryAcquire`(*b*) as an additional interface for both the `synch` and
`synchS` modules. This interface is like `acquire`(*b*) but never
blocks. It returns **True** if the binary semaphore was available (and
now acquired) or **False** if the binary semaphore was already acquired.
Hint: you do not have to change the existing code.

People who use an ATM often first check their balance and then withdraw
a certain amount of money not exceeding their balance. A negative
balance is not allowed. shows two operations on bank accounts: one to
check the balance and one to withdraw money. Note that all operations on
accounts are carefully protected by a lock (i.e., there are no data
races). The `customer` method models going to a particular ATM and
withdrawing money not exceeding the balance. Running the code through
Harmony reveals that there is a bug. It is a common type of concurrency
bug known as *Time Of Check Time Of Execution* (TOCTOE). In this case,
by the time the withdraw operation is performed, the balance can have
changed. Fix the code in . Note, you should leave the customer code the
same. You are only allowed to change the `atm_` methods, and you cannot
use the **atomically** keyword.



```python
x, y = 0, 100

def setX(a):
    x = a
    y = 100 – a

def getXY():
    result = [x, y]

def checker():
    let xy = getXY():
        assert (xy[0] + xy[1]) == 100, xy
    
spawn checker()
spawn setX(50)
```


```python
from synch import Lock, acquire, release
const N_ACCOUNTS = 2
const N_CUSTOMERS = 2
const N_ATMS = 2
const MAX_BALANCE = 1
accounts = [ { .lock: Lock(), .balance: choose({0..MAX_BALANCE})}
                            for i in {1..N_ACCOUNTS} ]
invariant min(accounts[acct].balance for acct in {0..N_ACCOUNTS–1})  > = 0

def atm_check_balance(acct):    # return the balance on acct
    acquire(?accounts[acct].lock)
    result = accounts[acct].balance
    release(?accounts[acct].lock)

def atm_withdraw(acct, amount): # withdraw amount from acct
    acquire(?accounts[acct].lock)
    accounts[acct].balance –= amount
    result = True              # return success
    release(?accounts[acct].lock)

def customer(atm, acct, amount):
    let bal = atm_check_balance(acct):
        if amount  < = bal:
            atm_withdraw(acct, amount)
        
for i in {1..N_ATMS}:
    spawn customer(i, choose({0..N_ACCOUNTS–1}),
                      choose({0..MAX_BALANCE}))
```
