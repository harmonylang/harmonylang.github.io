
# Monitors 

Tony Hoare, who came up with the concept of split binary semaphores
(SBS), devised an abstraction of the concept in a programming language
paradigm called *monitors*. (A similar construct was
independently invented by Per Brinch Hansen.) A monitor is a
special version of an object-oriented *class*, comprising a set of
variables and methods that operate on those variables. A monitor also
has special variables called *condition variables*, one per waiting
condition. There are two operations on condition variables: `wait` and
`signal`.

```python title="hoare.hny"
import synch

def Monitor():
    result = synch.Lock()

def enter(mon):
    synch.acquire(mon)

def exit(mon):
    synch.release(mon)

def Condition():
    result = { .sema: synch.BinSema(True), .count: 0 }

def wait(cond, mon):
    cond->count += 1
    exit(mon)
    synch.acquire(?cond->sema)
    cond->count –= 1

def signal(cond, mon):
    if cond->count > 0:
        synch.release(?cond->sema)
        enter(mon)
```

<figcaption>Figure 18.1 (<a href=https://harmony.cs.cornell.edu/modules/hoare.hny>modules/hoare.hny</a>): 
Implementation of Hoare monitors </figcaption>

Harmony does not have language support for monitors, but it has a module
called `hoare`. Figure 18.1 shows its implementation. A Hoare monitor
uses a hidden split binary semaphore. The mutex semaphore is acquired
when entering a monitor and released upon exit. Each condition variable
maintains a binary semaphore and a counter for the number of threads
waiting on the condition. Method `wait` increments the condition's
counter, releases the monitor mutex, blocks while trying to acquire the
condition's semaphore, and upon resuming decrements the counter---in
much the same way as we have seen for SBS. Method `signal` checks to see
if the condition's count is non-zero, if so releases the condition's
semaphore, and then blocks by trying to acquire the mutex again.

```python title="BBhoare.hny"
import hoare

def BoundedBuffer(size):
    result = {
            .mon: hoare.Monitor(),
            .prod: hoare.Condition(), .cons: hoare.Condition(),
            .buf: { x:() for x in {1..size} },
            .head: 1, .tail: 1,
            .count: 0, .size: size
        }
    

def put(bb, item):
    hoare.enter(?bb->mon)
    if bb->count == bb->size:
        hoare.wait(?bb->prod, ?bb->mon)
    bb->buf[bb->tail] = item
    bb->tail = (bb->tail % bb->size) + 1
    bb->count += 1
    hoare.signal(?bb->cons, ?bb->mon)
    hoare.exit(?bb->mon)

def get(bb):
    hoare.enter(?bb->mon)
    if bb->count == 0:
        hoare.wait(?bb->cons, ?bb->mon)
    result = bb->buf[bb->head]
    bb->head = (bb->head % bb->size) + 1
    bb->count –= 1
    hoare.signal(?bb->prod, ?bb->mon)
    hoare.exit(?bb->mon)
```

<figcaption>Figure 18.2 (<a href=https://harmony.cs.cornell.edu/modules/BBhoare.hny>modules/BBhoare.hny</a>): 
Bounded Buffer implemented using a Hoare monitor </figcaption>

Figure 18.2 presents a bounded buffer implemented using Hoare
monitors. It is written in much the same way you would if using the SBS
technique (see Exercise 16.3). However, there is no `release_one` method.
Instead, one can conclude that `put` guarantees that the queue will be
non-empty, and `signal` will check if there are any threads waiting for
this event. If so, `signal` will pass control to one such thread and,
unlike `release_one`, re-enter the critical section afterwards by
acquiring the *mutex*.

Implementing a reader/writer lock with Hoare monitors is not quite so
straightforward, unfortunately. When a writer releases the lock, it has
to choose whether to signal a reader or another writer. For that it
needs to know if there is a reader or writer waiting. The simplest
solution would be to peek at the counters inside the respective
condition variables, but that breaks the abstraction. The alternative is
for the reader/writer implementation to keep track of that state
explicitly, which complicates the code. Also, it requires a deep
understanding of the SBS method to remember to place a call to `signal`
in the `read_acquire` method that releases additional readers that may
be waiting to acquire the lock.

In the late 70s, researchers at Xerox PARC, where among others the
desktop and Ethernet were invented, developed a new programming language
called Mesa. Mesa introduced various important concepts to
programming languages, including software exceptions and incremental
compilation. Mesa also incorporated a version of monitors. However,
there are some subtle but important differences with Hoare monitors that
make Mesa monitors quite unlike split binary semaphores and mostly
easier to use in practice.

As in Hoare monitors, there is a hidden mutex associated with each Mesa
monitor, and the mutex must be acquired upon entry to a method and
released upon exit. Mesa monitors also have condition variables that a
thread can wait on. Like in Hoare monitors, the `wait` operation
releases the mutex. The most important difference is in what `signal`
does. To make the distinction more clear, we shall call the
corresponding Mesa operation `notify` rather than `signal`. Unlike
`signal`, when a thread *p* invokes `notify` it does not immediately
pass control to a thread that is waiting on the corresponding condition
(if there is such a thread). Instead, *p* continues executing in the
critical section until it leaves the monitor (by calling `release`) or
releases the monitor (by calling `wait`). Either way, any thread that
was notified will now have a chance to enter the critical section, but
they compete with other threads trying to enter the critical section.

Basically, there is just one gate to enter the critical section, instead
of a main gate and a gate per waiting condition. This is a very
important difference. In Hoare monitors, when a thread enters through a
waiting gate, it can assume that the condition associated with the
waiting gate still holds because no other thread can run in between. Not
so with Mesa monitors: by the time a thread that was notified enters
through the main gate, other threads may have entered first and
falsified the condition. So, in Mesa, threads always have to check the
condition again after resuming from the `wait` operation. This is
accomplished by wrapping each `wait` operation in a **while** statement
that loops until the condition of interest becomes valid. A Mesa monitor
therefore is more closely related to busy waiting than to split binary
semaphores.

Mesa monitors also allow notifying multiple threads. For example, a
thread can invoke `notify` twice---if there are two or more threads
waiting on the condition variable, two will be resumed. Operation
`notifyAll` (aka `broadcast)`) notifies *all* threads that are waiting
on a condition. Signaling multiple threads is not possible with Hoare
monitors because with Hoare monitors control must be passed immediately
to a thread that has been signaled, and that can only be done if there
is just one such thread.

The so-called "Mesa monitor semantics" or "Mesa condition variable
semantics" have become more popular than Hoare monitor semantics and
have been adopted by all major programming languages. That said, few
programming languages provide full syntactical support for monitors,
instead opting to support monitor semantics through library calls. In
Java, each object has a hidden lock *and* a hidden condition variable
associated with it. Methods declared with the `synchronized` keyword
automatically obtain the lock. Java objects also support `wait`,
`notify`, and `notifyAll`. In addition, Java supports explicit
allocations of locks and condition variables. In Python, locks and
condition variables must be explicitly declared. The `with` statement
makes it easy to acquire and release a lock for a section of code. In C
and C++, support for locks and condition variables is entirely through
libraries.


```python title="synch.hny"
def Condition():
    result = bag.empty()

def wait(c, lk):
    var cnt 0
    let ctx = get_context():
        atomically:
            cnt = bag.multiplicity(!c, ctx)
            !c = bag.add(!c, ctx)
            !lk = False
        atomically when (not !lk) and (bag.multiplicity(!c, ctx)  < =
cnt):
            !lk = True

def notify(c):
    atomically if !c != bag.empty():
        !c = bag.remove(!c, bag.bchoose(!c))
        

def notifyAll(c):
    !c = bag.empty()
```

<figcaption>Figure 18.3 (<a href=https://harmony.cs.cornell.edu/modules/synch.hny>modules/synch.hny</a>): 
Implementation of condition variables in the `synch` module
</figcaption>


```python title="RWcv.hny"
from synch import *

def RWlock():
    result = {
            .nreaders: 0, .nwriters: 0, .mutex: Lock(),
            .r_cond: Condition(), .w_cond: Condition()
        }
    

def read_acquire(rw):
    acquire(?rw->mutex)
    while rw->nwriters > 0:
        wait(?rw->r_cond, ?rw->mutex)
    rw->nreaders += 1
    release(?rw->mutex)

def read_release(rw):
    acquire(?rw->mutex)
    rw->nreaders –= 1
    if rw->nreaders == 0:
        notify(?rw->w_cond)
    release(?rw->mutex)

def write_acquire(rw):
    acquire(?rw->mutex)
    while (rw->nreaders + rw->nwriters) > 0:
        wait(?rw->w_cond, ?rw->mutex)
    rw->nwriters = 1
    release(?rw->mutex)

def write_release(rw):
    acquire(?rw->mutex)
    rw->nwriters = 0
    notifyAll(?rw->r_cond)
    notify(?rw->w_cond)
    release(?rw->mutex)
```

<figcaption>Figure 18.4 (<a href=https://harmony.cs.cornell.edu/code/RWcv.hny>code/RWcv.hny</a>): 
Reader/Writer Lock using Mesa-style condition variables
</figcaption>

Harmony provides support for Mesa monitors through the Harmony `synch`
module. Figure 18.3 shows the implementation of condition variables in
the `synch` module. `Condition()` creates a new condition variable. It
is represented by a dictionary containing a bag of contexts of threads
waiting on the condition variable. (The `synchS` library instead uses a
list of contexts.)

In Harmony, a bag is usually represented by a dictionary that maps the
elements of the bag to their multiplicities. For example, the value {
.*a*: 2, .*b*: 3 } represents a bag with two copies of .*a* and three
copies of .*b*. The `bag` module contains a variety of handy
functions on bags.

Method <{wait}> adds the context of the thread---used as a unique
identifier for the thread---to the bag,
incrementing the number of threads in the bag with the same context.
The Harmony `save` expression returns a tuple containing a value 
(in this case `()`) and the context of the thread. `wait` then loops
until that count is restored to the value that it had upon entry
to `wait`. Method `notify` removes an arbitrary context from the bag,
allowing one of the threads with that context to resume and re-acquire
the lock associated with the monitor. `notifyAll` empties out the entire
bag, allowing all threads in the bag to resume.

To illustrate how Mesa condition variables are used in practice, we
demonstrate using an implementation of reader/writer locks. Figure 18.4
shows the code. *mutex* is the shared lock that protects the critical
region. There are two condition variables: readers wait on *r_cond* and
writers wait on *w_cond*. The implementation also keeps track of the
number of readers and writers in the critical section.

Note that `wait` is always invoked within a **while** loop that checks
for the condition that the thread is waiting for. It is *imperative*
that there is always a **while** loop around any invocation of `wait`
containing the negation of the condition that the thread is waiting for.
Many implementation of Mesa condition variables depend on this, and
optimized implementations of condition variables often allow so-called
"spurious wakeups," where `wait` may sometimes return even if the
conditon variable has not been notified. As a rule of thumb, one should
always be able to replace `wait` by `release` followed by `acquire`.
This turns the solution into a busy-waiting one, inefficient but still
correct.

In `read_release`, notice that `notify`(?*w_cond*) is invoked when there
are no readers left, *without* checking if there are writers waiting to
enter. This is ok, because calling `notify` is a no-op if no thread is
waiting.

`write_release` executes `notifyAll`(?*r_cond*) as well as
`notify`(?*w_cond*). Because we do not keep track of the number of
waiting readers or writers, we have to conservatively assume that all
waiting readers can enter, or, alternatively, up to one waiting writer
can enter. So `write_release` wakes up all potential candidates. There
are two things to note here. First, unlike split binary semaphores or
Hoare monitors, where multiple waiting readers would have to be signaled
one at a time in a baton-passing fashion (see Figure 16.1), with
Mesa monitors all readers are awakened in one fell swoop using
`notifyAll`. Second, both readers and writers are awakened---this is ok
because both execute `wait` within a **while** loop, re-checking the
condition that they are waiting for. So, if both type of threads are
waiting, either all the readers get to enter next or one of the writers
gets to enter next. (If you want to prevent waking up both readers and a
writer, then you can keep track of how many threads are waiting in the
code.)

When using Mesa condition variables, you have to be careful to invoke
`notify` or `notifyAll` in the right places. Much of the complexity of
programming with Mesa condition variables is in figuring out when to
invoke `notify` and when to invoke `notifyAll`. As a rule of thumb: be
conservative---it is better to wake up too many threads than too few. In
case of doubt, use `notifyAll`. Waking up too many threads may lead to
some inefficiency, but waking up too few may cause the application to
get stuck. Harmony can be particularly helpful here, as it examines each
and every corner case. You can try to replace each `notifyAll` with
`notify` and see if every possible execution of the application still
terminates.

Andrew Birrell's paper on Programming with Threads gives an excellent
introduction to working with Mesa-style condition
variables.

## Exercises 

**18.1** Implement a solution to the bounded buffer problem using Mesa condition variables.

**18.2** Implement a "try lock" module using Mesa condition variables (see also
). It should have the following API:

1.  *tl* = `TryLock`() \# *create a try lock*

2.  `acquire`(?*tl*) \# *acquire a try lock*

3.  `tryAcquire`(?*tl*) \# *attempt to acquire a try lock*

4.  `release`(?*tl*) \# *release a try lock*

`tryAcquire` should not wait. Instead it should return `True` if the
lock was successfully acquired and `False` if the lock was not
available.

**18.3** Write a new version of the GPU allocator in Exercise 16.7 using Mesa condition
variables. In this version, a thread is allowed to allocate a set of
GPUs and release a set of GPUs that it has allocated. Method
`gpuAllocSet(n)` should block until $n$ GPUs are available, but it
should grant them as soon as they are available. It returns a set of $n$
GPU identifiers. Method `gpuReleaseSet(s)` takes a set of GPU
identifiers as argument. A thread does not have to return all the GPUs
it allocated at once. (You may want to try implementing this with Split
Binary Semaphores. It is not as easy.)

**18.4** The specification in the previous question makes the solution unfair.
Explain why this is so. Then change the specification and the solution
so that it is fair.

**18.5** Bonus problem: Figure 18.5 shows an iterative implementation of the Qsort algorithm, and
Figure 18.6 an accompanying test program. The array to be sorted
is stored in shared variable *testqs*.*arr*. Another shared variable,
*testqs*.*todo*, contains the ranges of the array that need to be sorted
(initially the entire array). Re-using as much of this code as you can,
implement a parallel version of this. You should not have to change the
methods `swap`, `partition`, or `sortrange` for this. Create `NWORKERS`
"worker threads" that should replace the `qsort` code. Each worker loops
until *todo* is empty and sorts the ranges that it finds until then. The
`main` thread needs to wait until all workers are done.

```python title="qsort.hny"
def Qsort(arr):
    result = { .arr: arr, .todo: { (0, len(arr) – 1) } }

def swap(p, q): # swap !p and !q
    !p, !q = !q, !p;

def partition(qs, lo, hi):
    result = lo
    for i in {lo..hi – 1}:
        if qs->arr[i]  < = qs->arr[hi]:
            swap(?qs->arr[result], ?qs->arr[i])
            result += 1
    swap(?qs->arr[result], ?qs->arr[hi]);

def sortrange(qs, range):
    let lo, hi = range let pivot = partition(qs, lo, hi):
        if (pivot – 1) > lo:
            qs->todo |= { (lo, pivot – 1) }
        if (pivot + 1) < hi:
            qs->todo |= { (pivot + 1, hi) }

def sort(qs):
    while qs->todo != {}:
        let range = choose(qs->todo):
            qs->todo –= { range }
            sortrange(qs, range)
    result = qs->arr
```

<figcaption>Figure 18.5 (<a href=https://harmony.cs.cornell.edu/code/qsort.hny>code/qsort.hny</a>): 
Iterative qsort() implementation </figcaption>


```python title="qsorttest.hny"
import qsort, bag
const NITEMS = 4
a = [ choose({1..NITEMS}) for i in {1..choose({1..NITEMS})} ]
testqs = qsort.Qsort(a)
sa = qsort.sort(?testqs)
assert all(sa[i – 1]  < = sa[i] for i in {1..len(sa)–1}) # sorted?
assert bag.fromList(a) == bag.fromList(sa); # is it a permutation?
```

<figcaption>Figure 18.6 (<a href=https://harmony.cs.cornell.edu/code/qsorttest.hny>code/qsorttest.hny</a>): 
Test program for Figure 18.5 </figcaption>
