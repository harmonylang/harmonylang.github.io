
# Non-Blocking Synchronization 


```python
const MAX_ITEMS = 3
sequential back, items
back = 0
items = [None,] * MAX_ITEMS

def inc(pcnt):
    atomically:
        result = !pcnt
        !pcnt += 1

def exch(pv):
    atomically:
        result = !pv
        !pv = None

def produce(item):
    items[inc(?back)] = item

def consume():
    result = None
    while result == None:
        var i = 0
        while (i < back) and (result == None):
            result = exch(?items[i])
            i += 1
for i in {1..MAX_ITEMS}:
    spawn produce(i)
for i in {1..choose({0..MAX_ITEMS})}:
    spawn consume()
```

<figcaption>Figure 25.1 (
<a href=https://harmony.cs.cornell.edu/code/hw.hny>code/hw.hny</a>): 
Non-blocking queue </figcaption>

So far, we have concentrated on critical sections to synchronize
multiple threads. Certainly, preventing multiple threads from accessing
certain code at the same time simplifies how to think about
synchronization. However, it can lead to starvation. Even in the absence
of starvation, if some thread is slow for some reason while being in the
critical section, the other threads have to wait for it to finish
executing the critical section. Also, using synchronization primitives
in interrupt handlers is tricky to get right ([Chapter 24](interrupts.md)) and
might be too slow. In this chapter, we will have a look at how one can
develop concurrent code in which threads do not have to wait for other
threads (or interrupt handlers) to complete their ongoing operations.

As an example, we will revisit the producer/consumer problem. The code
in Figure 25.1 is based on code developed by Herlihy and Wing.
The code is a "proof of existence" for non-blocking synchronization; it
is not necessarily practical. There are two variables. *items* is an
unbounded array with each entry initialized to `None`. *back* is an
index into the array and points to the next slot where a new value is
inserted. The code uses two atomic operations:

-   `inc`(*p*): atomically increments !*p* and returns the old value;

-   `exch`(*p*): sets !*p* to `None` and returns the old value.

Method `produce`(*item*) uses `inc`(?*back*) to allocate the next
available slot in the *items* array. It stores the item as a singleton
tuple. Method `consume`() repeatedly scans the array, up to the *back*
index, trying to find an item to return. To check an entry, it uses
`exch`() to atomically remove an item from a slot if there is one. This
way, if two or more threads attempt to extract an item from the same
slot, at most one will succeed.

There is no critical section. If one thread is executing instructions
very slowly, this does not negatively impact the other threads, as it
would with solutions based on critical sections. On the contrary, it
helps them because it creates less contention. Unfortunately, the
solution is not practical for the following reasons:

-   The *items* array must be of infinite size if an unbounded number of
    items may be produced;

-   Each slot in the array is only used once, which is inefficient;

-   the `inc` and `exch` atomic operations are not universally available
    on existing processors.

However, in the literature you can find examples of practical
non-blocking (aka *wait-free*) synchronization algorithms.

## Exercises 


A *seqlock* consists of a lock and a version number. An update operation
acquires the lock, increments the version number, makes the changes to
the data structure, and then releases the lock. A read-only operation
does not use the lock. Instead, it retrieves the version number, reads
the data structure, and then checks if the version number has changed.
If so, the read-only operation is retried. Use a seqlock to implement a
bank much like , with one seqlock for the entire bank (i.e., no locks on
individual accounts). Method `transfer` is an update operation; method
`total` is a read-only operation. Explain how a seqlock can lead to
starvation.

