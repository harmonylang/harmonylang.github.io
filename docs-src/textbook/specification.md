
# Specification 

So far, we have used Harmony to *implement* various algorithms. But
Harmony can also be used to *specify* what an algorithm is supposed to
do. For example, Figure 8.1 specifies the intended behavior of a
lock. In this case, a lock is a boolean, initially `False`, with two
operations, `acquire()` and `release()`. The `acquire()` operation waits
until the lock is `False` and then sets it to `True` in an atomic
operation. The `release()` operation sets the lock back to `False`. The
code is similar to Figure 5.3, except that waiting for the lock
to become available and taking it is executed as an atomic operation.

```python title="synch.hny"
def Lock():
    result = False

def acquire(lk):
    atomically when not !lk:
        !lk = True

def release(lk):
    assert !lk
    atomically !lk = False
```

<figcaption>Figure 8.1 (<a href=https://harmony.cs.cornell.edu/modules/synch.hny>modules/synch.hny</a>): 
Specification of a lock </figcaption>


```python title="cssynch.hny"
import synch
const NTHREADS = 2
lock = synch.Lock()

def thread():
    while choose({ False, True }):
        synch.acquire(?lock)
        cs: assert countLabel(cs) == 1
        synch.release(?lock)
for i in {1..NTHREADS}:
    spawn thread()
```

<figcaption>Figure 8.2 (<a href=https://harmony.cs.cornell.edu/code/UpLock.hny>code/cssynch.hny</a>): 
Using a lock to implement a critical section</figcaption>

```python
from synch import Lock, acquire, release
sequential done
count = 0
countlock = Lock()
done = [ False, False ]

def thread(self):
    acquire(?countlock)
    count = count + 1
    release(?countlock)
    done[self] = True
    await done[1 – self]
    assert count == 2
spawn thread(0)
spawn thread(1)
```

<figcaption>Figure 8.3 (<a href=https://harmony.cs.cornell.edu/code/UpLock.hny>code/UpLock.hny</a>): 
Program of Figure 3.2 fixed with a lock </figcaption>

The code in Figure 8.1 is similar to the code in Harmony's `synch`
module. (The module generalizes locks to *binary semaphores*
([Chapter 16](sbs.md)), but the lock interface is the same.) Figure 8.2 shows
how locks may be used to implement a critical section. Figure 8.3
gives an example of how locks may be used to fix the program of
Figure 3.2.

Note that the code of Figure 8.1 is executable in Harmony.
However, the **atomically** keyword is not available in general
programming languages and should not be used for implementation.
Peterson's algorithm is an implementation of a lock, although only for
two processes. In the following chapters, we will look at more general
ways of implementing locks using atomic constructions that are usually
available in the underlying hardware.

In Harmony, any statement can be preceded by the **atomically** keyword.
It means that statement as a whole is to be executed atomically. The
**atomically** keyword can be used to specify the behavior of methods
such as `acquire` and `release`. But an actual executable program---such
as the one in Figure 8.2---should not use the **atomically**
keyword because---on a normal machine---it cannot be directly compiled
into machine code. If we want to make the program executable on
hardware, we have to show how `Lock`, `acquire`, and `release` are
implemented, not just how they are specified. [Chapter 9](spinlock.md) presents
such an implementation.

The code in Figure 8.1 also uses the Harmony **when** statement. A
**when** statement waits until a time in which condition holds (not
necessarily the first time) and then executes the statement block. The
"**await** *condition*" statement is the same as "**when** *condition*:
**pass**". Combined with the **atomically** keyword, the entire
statement is executed atomically at a time that the condition holds.

It is important to appreciate the difference between an *atomic section*
(the statements executed within an atomic block of statements) and a
*critical section* (protected by a lock of some sort). The former
ensures that while the statements are executing no other thread can
execute. The latter allows multiple threads to run concurrently, just
not within the critical section. The former is rarely available to a
programmer (e.g., none of Python, C, or Java support it), while the
latter is very common.

Atomic statements are not intended to replace locks or other
synchonization primitives. When implementing synchronization solutions
you should not directly use atomic statements but use the
synchronization primitives that are available to you. But if you want to
*specify* a synchronization primitive, then use **atomically** by all
means. You can also use atomic statements in your test code. In fact, as
mentioned before, **assert** statements are included to test if certain
conditions hold in every execution and are executed atomically.
