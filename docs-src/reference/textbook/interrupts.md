
# Interrupts 


```python
sequential done
count = 0
done = False

def handler():
    count += 1
    done = True

def main():
    trap handler()
    await done
    assert count == 1
spawn main()
```

<figcaption>Figure 24.1 (
<a href=https://harmony.cs.cornell.edu/code/trap.hny>code/trap.hny</a>): 
How to use **trap** </figcaption>


```python
sequential done
count = 0
done = False

def handler():
    count += 1
    done = True

def main():
    trap handler()
    count += 1
    await done
    assert count == 2
spawn main()
```

<figcaption>Figure 24.2 (
<a href=https://harmony.cs.cornell.edu/code/trap2.hny>code/trap2.hny</a>): 
A race condition with interrupts </figcaption>


```python
from synch import Lock, acquire, release
sequential done
countlock = Lock()
count = 0
done = False

def handler():
    acquire(?countlock)
    count += 1
    release(?countlock)
    done = True

def main():
    trap handler()
    acquire(?countlock)
    count += 1
    release(?countlock)
    await done
    assert count == 2
spawn main()
```

<figcaption>Figure 24.3 (
<a href=https://harmony.cs.cornell.edu/code/trap3.hny>code/trap3.hny</a>): 
Locks do not work with interrupts </figcaption>


```python
sequential done
count = 0
done = False

def handler():
    count += 1
    done = True

def main():
    trap handler()
    setintlevel(True)
    count += 1
    setintlevel(False)
    await done
    assert count == 2
spawn main()
```

<figcaption>Figure 24.4 (
<a href=https://harmony.cs.cornell.edu/code/trap4.hny>code/trap4.hny</a>): 
Disabling and enabling interrupts </figcaption>

Threads can be *interrupted*. An interrupt is a notification of some
event such as a keystroke, a timer expiring, the reception of a network
packet, the completion of a disk operation, and so on. We distinguish
*interrupts* and *exceptions*. An exception is caused by the thread
executing an invalid machine instruction such as divide-by-zero. An
interrupt is caused by some peripheral device and can be handled in
Harmony. In other words: an interrupt is a notification, while an
exception is an error.

Harmony allows modeling interrupts using the `trap` statement:

**trap** `handler` *argument*

invokes `handler` *argument* at some later, unspecified time. Thus you
can think of **trap** as setting a timer. Only one of these asynchronous
events can be outstanding at a time; a new call to **trap** overwrites
any outstanding one. Figure 24.1 gives an example of how **trap** might
be used. Here, the `main`() thread loops until the interrupt has
occurred and the *done* flag has been set.

But now consider Figure 24.2. The difference with Figure 24.1 is that
both the `main`() and `handler`() methods increment *count*. This is not
unlike the example we gave in Figure 3.2, except that only a single
thread is involved now. And, indeed, it suffers from a similar race
condition; run it through Harmony to see for yourself. If the interrupt
occurs after `main`() reads *count* (and thus still has value 0) but
before `main`() writes the updated value 1, then the interrupt handler
will also read value 0 and write value 1. We say that the code in
Figure 24.2 is not *interrupt-safe* (as opposed to not being
*thread-safe*).

You would be excused if you wanted to solve the problem using locks,
similar to Figure 8.3. Figure 24.3 shows how one might go about
this. But locks are intended to solve synchronization issues between
multiple threads. But an interrupt handler is not run by another
thread---it is run by the same thread that experienced the interrupt. If
you run the code through Harmony, you will find that the code may not
terminate. The issue is that a thread can only acquire a lock once. If
the interrupt happens after `main`() acquires the lock but before
`main`() releases it, the `handler`() method will block trying to
acquire the lock, even though it is being acquired by the same thread
that already holds the lock.

Instead, the way one fixes interrupt-safety issues is through disabling
interrupts temporarily. In Harmony, this can be done by setting the
*interrupt level* of a thread to `True` using the **setintlevel**
interface. Figure 24.4 illustrates how this is done. Note that it is
not necessary to change the interrupt level during servicing an
interrupt, because it is automatically set to `True` upon entry to the
interrupt handler and restored to `False` upon exit. It is important
that the `main`() code re-enables interrupts after incrementing *count*.
What would happen if `main`() left interrupts disabled?

**setintlevel**(*il*) sets the interrupt level to *il* and returns the
prior interrupt level. Returning the old level is handy when writing
interrupt-safe methods that can be called from ordinary code as well as
from an interrupt handler. Figure 24.5 shows how one might write a
interrupt-safe method to increment the counter.


```python
sequential done
count = 0
done = False

def increment():
    let prior = setintlevel(True):
        count += 1
        setintlevel(prior)

def handler():
    increment()
    done = True

def main():
    trap handler()
    increment()
    await done
    assert count == 2
spawn main()
```

<figcaption>Figure 24.5 (
<a href=https://harmony.cs.cornell.edu/code/trap5.hny>code/trap5.hny</a>): 
Example of an interrupt-safe method </figcaption>


```python
from synch import Lock, acquire, release
sequential done
count = 0
countlock = Lock()
done = [ False, False ]

def increment():
    let prior = setintlevel(True):
        acquire(?countlock)
        count += 1
        release(?countlock)
        setintlevel(prior)

def handler(self):
    increment()
    done[self] = True

def thread(self):
    trap handler(self)
    increment()
    await all(done)
    assert count == 4, count
spawn thread(0)
spawn thread(1)
```

<figcaption>Figure 24.6 (
<a href=https://harmony.cs.cornell.edu/code/trap6.hny>code/trap6.hny</a>): 
Code that is both interrupt-safe and thread-safe </figcaption>

It will often be necessary to write code that is both interrupt-safe
*and* thread-safe. As you might expect, this involves both managing
locks and interrupt levels. To increment *count*, the interrupt level
must be `True` and *countlock* must be held. Figure 24.6 gives an
example of how this might be done. One important rule to remember is
that a thread should disable interrupts *before* attempting to acquire a
lock.

Try moving *lock*() to the beginning of the `increment` method and
*unlock*() to the end of `increment` and see what happens. While Harmony
will only report one faulty run, this incorrect code can lead to the
assertion failing as well as threads getting blocked indefinitely.

(Another option is to use synchronization techniques that do not use
locks. See [Chapter 25](nonblocking.md) for more information.)

There is another important rule to keep in mind. Just like locks should
never be held for long, interrupts should never be disabled for long.
With locks the issue is to maximize concurrent performance. For
interrupts the issue is fast response to asynchronous events. Because
interrupts may be disabled only briefly, interrupt handlers must run
quickly and cannot wait for other events.

## Exercises 


The `put` method you implemented in Example 19.2 cannot be used in
interrupt handlers for two reasons: (1) it is not interrupt-safe, and
(2) it may block for a long time if the buffer is full. Yet, it would be
useful if, say, a keyboard interrupt handler could place an event on a
shared queue. Implement a new method `i_put`(*item*) that does not
block. Instead, it should return `False` if the buffer is full and
`True` if the item was successfully enqueued. The method also needs to
be interrupt-safe.

