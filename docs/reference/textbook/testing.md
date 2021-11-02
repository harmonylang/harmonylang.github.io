
# Testing 


```python
import synch
lock = synch.Lock()
count = 0
invariant 0  < = count  < = 1

def thread():
    synch.acquire(?lock)
    atomically count += 1
    # critical section is here
    assert count == 1
    atomically count –= 1
    synch.release(?lock)
for i in {1..5}:
    spawn thread()
```


```python
import list

def Queue():
    result = [ ]

def put(q, v):
    !q = list.append(!q, v)

def get(q):
    if !q == [ ]:
        result = None
    else:
        result = list.head(!q)
        !q = list.tail(!q)
```


```python
import queue, queuespec
const NOPS = 4
const VALUES = { 1..NOPS }
implq = queue.Queue()
specq = queuespec.Queue()
for i in {1..NOPS}:
    let op = choose({ .get, .put }):
        if op == .put:
            let v = choose(VALUES):
                queue.put(?implq, v)
                queuespec.put(?specq, v)
        else:
            let v = queue.get(?implq)
            let w = queuespec.get(?specq):
                assert v == w
```


```python
from synch import Lock, acquire, release
from alloc import malloc, free

def Queue():
    result = { .head: None, .tail: None, .lock: Lock(), .time: 0 }

def _linpoint(q):
    atomically:
        this.qtime = q->time
        q->time += 1

def put(q, v):
    let node = malloc({ .value: v, .next: None }):
        acquire(?q->lock)
        if q->tail == None:
            q->tail = q->head = node
        else:
            q->tail->next = node
            q->tail = node
        _linpoint(q)
        release(?q->lock)
    

def get(q):
    acquire(?q->lock)
    let node = q->head:
        if node == None:
            result = None
        else:
            result = node->value
            q->head = node->next
            if q->head == None:
                q->tail = None
            free(node)
    _linpoint(q)
    release(?q->lock)
```


```python
import queuelin, queuespec
const NOPS = 4
const VALUES = { 1..NOPS }
sequential qtime
qtime = 0
implq = queuelin.Queue()
specq = queuespec.Queue()

def thread():
    let op = choose({ .get, .put }):
        if op == .put:
            let v = choose(VALUES):
                queuelin.put(?implq, v)
                await qtime == this.qtime
                queuespec.put(?specq, v)
        else:
            let v = queuelin.get(?implq):
                await qtime == this.qtime
                let w = queuespec.get(?specq):
                    assert v == w
    atomically qtime += 1
for i in {1..NOPS}:
    spawn thread()
```

Testing is a way to increase confidence in the correctness of an
implementation. demonstrates how concurrent queues may be used, but it
is not a very thorough test program for an implementation such as the
one in and does little to increase our confidence in its correctness. To
wit, if `get()` always returned 1, the program would find no problems.
In this chapter, we will look at approaches to testing concurrent code.

The framework in works well for thoroughly testing mutual exclusion and
progress in critical sections, but depends on `countLabel`, an unusual
operator specific to Harmony that is mostly useful for testing mutual
exclusion. It turns out that we do not need labels to express this.
tests mutual exclusion and progress for critical sections implemented
using locks. The test uses a simple atomic counter that is incremented
before entering the critical section and decremented after leaving it.
Mutual exclusion holds if the counter never goes over 1.

*Test programs themselves should be tested*. Just because a test program
works with a particular implementation does not mean the implementation
is correct---it may be that the implementation is incorrect but the test
program does not have enough coverage to find any bugs in the
implementation. In the case of testing mutual exclusion with atomic
counters, you will want to see if you can use this method to find the
problems in , , and . Conversely, a test program may be broken in that
it finds bugs that do not exist. So, in this case, you also want to
check if an atomic counter solution works with known correct solutions
such as and if possible.

As with critical sections, when testing a concurrent data structure we
need a specification for its correctness. A good place to start is
thinking about a *sequential* specification for queues. A specification
is simply a program, written at a high level of abstraction. shows a
sequential specification of a queue in Harmony (exploiting some methods
from the `list` module described in ).

First we can check if the queue implementation in meets the sequential
queue specification in . To check if the queue implementation meets the
specification, we need to see if any sequence of queue operations in the
implementation matches a corresponding sequence in the specification. We
say that the implementation and the specification have the same
*behavior*. presents a test program that does exactly this, for
sequences of up to `NOPS` queue operations. It maintains two queues:

-   *implq*: the queue of the implementation;

-   *specq*: the queue of the specification

For each operation, the code first decides whether to perform a `get` or
`put` operation. In the case of a `put` operation, the code also decides
which value to append to the queue. All operations are performed on both
the queue implementation and the queue specification. In the case of
`get`, the results of the operation on both the implementation and
specification are checked against one another.

As with any other test program, may not trigger extant bugs, but it
nonetheless inspires reasonable confidence that the queue implementation
is correct, at least sequentially. The higher `NOPS`, the higher the
confidence. It is possible to write similar programs in other languages
such as Python, but the `choose` expression in Harmony makes it
relatively easy to explore all corner cases. For example, a common
programming mistake is to forget to update the `tail` pointer in `get()`
in case the queue becomes empty. Normally, it is a surprisingly tricky
bug to find. You can comment out those lines in and run the test
program---it should easily find the bug and explain exactly how the bug
manifests itself, adding confidence that the test program is reasonably
thorough.

The test program also finds some common mistakes in using locks, such as
forgetting to release a lock when the queue is empty, but it is not
designed to find concurrency bugs in general. If you remove all
`acquire()` and `release()` calls from , the test program will not (and
should not) find any errors. The next step is to test if the queue
implementation meets the *concurrent* queue specification or not. But we
have not yet shown what the concurrent queue specification is.

We briefly mentioned the notion of *linearizability* in . Basically, we
want a concurrent queue to behave consistently with a sequential queue
in that all `put` and `get` operations should appear to happen in a
total order. Moreover, we want to make sure that if some `put` or `get`
operation $o_1$ finished before another operation $o_2$ started, then
$o_1$ should appear to happen before $o_2$ in the total order. If these
two conditions are met, then we say that the concurrent queue
implementation is linearizable.

In general, if a data structure is protected by a single lock and every
operation on that data structure starts with acquiring the lock and ends
with releasing the lock, it will automatically be linearizable. The
queue implementation in does not quite match this pattern, as the `put`
operation allocates a new node before acquiring the lock. However, in
this case that is not a problem, as the new node has no dependencies on
the queue when it is allocated.

Still, it would be useful to check in Harmony that is linearizable. To
do this, instead of applying the operations sequentially, we want the
test program to invoke the operations concurrently, consider all
possible interleavings, and see if the result is consistent with an
appropriate sequential execution of the operations.

Harmony provides support for testing linearizability, but requires that
the programmer identifies what are known as *linearization points* in
the implementation that indicate exactly *which* sequential execution
the concurrent execution must align with. is a copy of extended with
linearization points. For each operation (`get` and `put`), the
corresponding linearization point must occur somewhere between acquiring
and releasing the lock. Each linearization point execution is assigned a
logical timestamp. Logical timestamps are numbered $0, 1, ...$ To do so,
we have added a counter (`time`) to the `Queue`. Method `_linpoint`
saves the current counter in **this**.`qtime` and increments the
counter. The **this** dictionary maintains *thread-local state*
associated with the thread ()---it contains variables that can be
accessed by any method in the thread.

Given the linearization points, shows how linearizability can be tested.
The test program is similar to the sequential test program () but starts
a thread for each operation. The operations are executed concurrently on
the concurrent queue implementation of , but they are executed
sequentially on the sequential queue specification of . To that end, the
test program maintains a global time variable *qtime*, and each thread
waits until the timestamp assigned to the last concurrent queue
operation matches *qtime* before invoking the sequential operation in
the specification. Afterward, it atomically increments the shared
*qtime* variable. This results in the operations being executed
sequentially against the sequential specification in the same order of
the linearization points of the concurrent specification.


```python
import queue
const N = 3
sequential putcount
testq = queue.Queue()
putcount = 0

def putter(v):
    queue.put(?testq, v)
    atomically putcount += 1

def main():
    await putcount == N
    var gotten = {}
    while gotten != {0..N–1}:
        let v = queue.get(?testq):
            assert v not in gotten
            gotten |= {v}
    let v = queue.get(?testq):
        assert v == None
for i in {0..N–1}:
    spawn putter(i)
spawn main()
```

If you want a purely black box test for testing a queue implementation,
then adding linearization points is not possible. We will present a few
test programs that try to identify incorrect behavior of a black box
queue implementation in the presence of concurrency.

shows a program that checks concurrent `put` operations using `N`
threads. Thread `putter(v)` adds $v$ to the queue. Thread `main()` waits
until all `putter` threads have finished, and then dequeues `N` items,
verifying that they form the set $\{ 0 .. \mathtt{N} - 1 \}$.


```python
import queue
const N = 3
sequential gotten
testq = queue.Queue()
for i in {0..N–1}:
    queue.put(?testq, i)
gotten = {}

def getter():
    let v = queue.get(?testq):
        atomically:
            assert v not in gotten
            assert v != None
            gotten |= {v}

def main():
    await gotten == {0..N–1}
    let v = queue.get(?testq):
        assert v == None
for i in {0..N–1}:
    spawn getter()
spawn main()
```

Similarly, shows a program that checks concurrent `get` operations using
`N` threads. The queue is initialized with the sequence
$0 .. \mathtt{N} - 1$. Thread `getter(v)` removes an entry from the
queue and makes sure that no other thread got the same entry. Thread
`main()` waits until all `getter` threads have finished and checks to
make sure that the queue is empty.


```python
import queue
const N = 3
sequential putcount, getcount
testq = queue.Queue()
gotten = {}
putcount = getcount = 0

def putter(v):
    queue.put(?testq, v)
    atomically putcount += 1

def getter():
    let v = queue.get(?testq):
        atomically:
            assert v not in gotten
            if v != None:
                gotten |= {v}
            getcount += 1

def main():
    await (getcount == N) and (putcount == N)
    while gotten != {0..N–1}:
        let v = queue.get(?testq):
            assert v not in gotten
            gotten |= {v}
    let v = queue.get(?testq):
        assert v == None
for i in {0..N–1}:
    spawn putter(i)
    spawn getter()
spawn main()
```

checks a mixture of concurrent `get` and `put` operations. It starts `N`
`getter` threads and `N` `putter` threads. Thread `main` waits until all
have finished, and then checks to make sure that whatever is left on the
queue was not also consumed by some `getter` thread. Finally, it makes
sure that the queue is empty once all the values that were added to it
by the `putter` threads have been consumed.

A common mistake that people make is to use a globally shared variable
in the implementation of a concurrent data structure. The `get()` method
of the queue implementation uses a local variable *node*, declared using
a **let** statement, but it would be easy to mistakenly use a global
variable *node* instead. If there is only one queue, this is not an
issue. So, it is important to test not just one queue at a time, but
also multiple queues. gives an example that tests the `get` method for
use of global variables. Even if the assertion does not fail, Harmony
might find a data race if there are global variables shared between
different queues.

While having five different test programs is fine, it would be nice if
we can combine them all in one test program. This has to be done with
some care, as running the concurrent test programs simultaneously would
lead to a state space explosion. Instead, we can leverage the **choose**
expression. shows how one might go about this. Harmony will run all the
tests, but the tests do not interfere with one another.


```python
import queue
q1 = q2 = queue.Queue()
queue.put(?q1, 1)
queue.put(?q2, 2)

def getter(q, v):
    let x = queue.get(q):
        assert x == v
spawn getter(?q1, 1)
spawn getter(?q2, 2)
```


```python
def seq_test():
    pass

def conc_test1():
    pass

def conc_test2():
    pass

def conc_test3():
    pass
seq_test()
let test = choose({ conc_test1, conc_test2, conc_test3 }):
    test()
```

## Exercises 


Write a sequential specification for . (Hint: it implements a set of
integers.) Write a Harmony program that checks if meets the sequential
specification.

Extend with linearization points and check if the implementation is
linearizable.

Check if the extended queue implementation of is linearizable.

