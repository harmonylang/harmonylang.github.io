
# Starvation 


```python
from synch import BinSema, acquire, release

def RWlock():
    result = {
            .nreaders: 0, .nwriters: 0, .mutex: BinSema(False),
            .r_gate: { .sema: BinSema(True), .count: 0 },
            .w_gate: { .sema: BinSema(True), .count: 0 }
        }

def read_acquire(rw):
    acquire(?rw->mutex)
    if (rw->nwriters > 0) or (rw->w_gate.count > 0):
        rw->r_gate.count += 1; release(?rw->mutex)
        acquire(?rw->r_gate.sema); rw->r_gate.count –= 1
    rw->nreaders += 1
    if rw->r_gate.count > 0:
        release(?rw->r_gate.sema)
    else:
        release(?rw->mutex)

def read_release(rw):
    acquire(?rw->mutex)
    rw->nreaders –= 1
    if (rw->w_gate.count > 0) and (rw->nreaders == 0):
        release(?rw->w_gate.sema)
    else:
        release(?rw->mutex)
    

def write_acquire(rw):
    acquire(?rw->mutex)
    if (rw->nreaders + rw->nwriters) > 0:
        rw->w_gate.count += 1; release(?rw->mutex)
        acquire(?rw->w_gate.sema); rw->w_gate.count –= 1
    rw->nwriters += 1
    release(?rw->mutex)

def write_release(rw):
    acquire(?rw->mutex)
    rw->nwriters –= 1
    if rw->r_gate.count > 0:
        release(?rw->r_gate.sema)
    elif rw->w_gate.count > 0:
        release(?rw->w_gate.sema)
    else:
        release(?rw->mutex)
```

A *property* is a set of traces. If a program has a certain property,
that means that the traces that that program allows are a subset of the
traces in the property. So far, we have pursued two properties: *mutual
exclusion* and *progress*. The former is an example of a *safety
property*---it prevents something "bad" from happening, like a reader
and writer thread both acquiring a reader/writer lock. The *progress*
property is an example of a *liveness property*---guaranteeing that
something good eventually happens. Informally (and inexactly), progress
states that if no threads are in the critical section, then some thread
that wants to enter can.

Progress is a weak form of liveness. It says that *some* thread can
enter, but it does not prevent a scenario such as the following. There
are three threads repeatedly trying to enter a critical section using a
spinlock. Two of the threads successfully keep entering, alternating,
but the third thread never gets a turn. This is an example of
*starvation*. With a spinlock, this scenario could even happen with two
threads. Initially both threads try to acquire the spinlock. One of the
threads is successful and enters. After the thread leaves, it
immediately tries to re-enter. This state is identical to the initial
state, and there is nothing that prevents the same thread from acquiring
the lock yet again. (It is worth noting that Peterson's Algorithm ()
does not suffer from starvation, thanks to the `turn` variable that
alternates between 0 and 1 when two threads are contending for the
critical section.)

While spinlocks suffer from starvation, it is a uniform random process
and each thread has an equal chance of entering the critical section.
Thus the probability of starvation is exponentially vanishing. We shall
call such a solution *fair* (although it does not quite match the usual
formal nor vernacular concepts of fairness).

Unfortunately, such is not the case for the reader/writer solution that
we presented in . Consider this scenario: there are two readers and one
writer. One reader is in the critical section while the writer is
waiting. Now the second reader tries to enter and is able to. The first
reader leaves. We are now in a similar situation as the initial state
with one reader in the critical section and the writer waiting, but it
is not the same reader. Unfortunately for the writer, this scenario can
repeat itself indefinitely. So, even if neither reader was in the
critical section all of the time, and the second reader arrived well
after the writer, the writer never had a chance.

SBSs allow much control over which type of thread runs next and is
therefore a good starting point for developing fair synchronization
algorithms. is based on , but there are two important differences:

1.  When a reader tries to enter the critical section, it yields not
    only if there are writers in the critical section, but also if there
    are writers waiting to enter the critical section;

2.  Instead of a one-size-fits-all `release_one` method, each method has
    a custom way of selecting which gate to open. In particular,
    `read_release` prefers the write gate, while `write_release` prefers
    the read gate.

The net effect of this is that if there is contention between readers
and writers, then readers and writers end up alternating entering the
critical section. While readers can still starve other readers and
writers can still starve other writers, readers can no longer starve
writers nor vice versa. Other fairness is based on the fairness of
semaphores themselves.

## Exercises 


Write a fair solution to the one-lane bridge problem of .

