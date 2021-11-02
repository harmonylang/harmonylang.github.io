
# The Problem of Concurrent Programming 




Concurrent programming, aka multithreaded programming, involves multiple
threads running in parallel while sharing variables. shows two programs.
Program (a) is sequential. It sets *shared* to **True**, asserts that
*shared* = **True**, and finally sets *shared* to **False**. If you run
the program through Harmony, it will not find any problems because there
is only one execution possible and 1) in that execution the assertion
does not fail and 2) the execution terminates. Program (b) is
concurrent. It executes methods `f()` and `g()` in parallel. If method
`g()` runs and completes before `f()`, then the assertion in `f()` will
fail when `f()` runs. Harmony will find this problem. This problem is an
example of non-determinism: methods `f()` and `g()` can run in either
order.

This code presents a more subtle example that illustrates non-atomicity. The
program initializes two shared variables: an integer *count* and an
array *done* with two booleans. The program then spawns two threads. The
first runs `incrementer(0)`; the second runs `incrementer(1)`.

Method `incrementer` takes a parameter called *self*. It increments
*count* and sets *done*\[*self*\] to **True**. It then waits until the
other thread is done. (**await** $c$ is shorthand for **while not** $c$:
**pass**.) After that, method `incrementer` verifies that the value of
*count* equals 2.

Note that although the threads are *spawned* one at a time, they will
execute concurrently. It is, for example, quite possible that
`incrementer(1)` finishes before `incrementer(0)` even gets going. And
because Harmony tries every possible execution, it will consider that
particular execution as well. What would the value of *count* be at the
end of that execution?


```python
count = 0
done = [ False, False ]

def incrementer(self):
    count = count + 1
    done[self] = True
    await done[1 – self]
    assert count == 2
spawn incrementer(0)
spawn incrementer(1)
```

> -   Before you run the program, what do you think will happen? Is the
>     program correct in that *count* will always end up being 2? (You
>     may assume that `load` and `store` instructions of the underlying
>     virtual machine architecture are atomic (indivisible)---in fact
>     they are.)

What is going on is that the Harmony program is compiled to machine
instructions, and it is the machine instructions that are executed by
the underlying Harmony machine. The details of this appear in , but
suffice it to say that the machine has instructions that load values
from memory and store values into memory. Importantly, it does not have
instructions to atomically increment or decrement values in shared
memory locations. So, to increment a value in memory, the machine must
do at least three machine instructions. Conceptually:

1.  load the value from the memory location;

2.  add 1 to the value;

3.  store the value to the memory location.

When running multiple threads, each essentially runs an instantiation of
the machine, and they do so in parallel. As they execute, their machine
instructions are interleaved in unspecified and often unpredictable
ways. A program is correct if it works for any interleaving of threads.
Harmony will try all possible interleavings of the threads executing
machine instructions.

If the threads run one at a time, then *count* will be incremented twice
and ends up being 2. However, the following is also a possible
interleaving of `incrementer(0)` and `incrementer(1)`:

1.  `incrementer(0)` loads the value of *count*, which is 0;

2.  `incrementer(1)` loads the value of *count*, which is still 0;

3.  `incrementer(1)` adds 1 to the value that it loaded (0), and stores
    $1$ into *count*;

4.  `incrementer(0)` adds 1 to the value that it loaded (0), and stores
    $1$ into *count*;

5.  `incrementer(0)` sets *done*\[0\] to **True**;

6.  `incrementer(1)` sets *done*\[1\] to **True**.

The result in this particular interleaving is that *count* ends up
being 1. This is known as a *race condition*. When running Harmony, it
will report violations of assertions. It also provides an example of an
interleaving, like the one above, in which an assertion fails.

If one thinks of the assertion as providing the specification of the
program, then clearly its implementation does not satisfy its
specification. Either the specification or the implementation (or both)
must have a bug. We could change the specification by changing the
assertion as follows:

**assert** (*count* == 1) or (*count* == 2)

This would fix the issue,[^1] but more likely it is the program that
must be fixed, not the specification.

The exercises below have you try the same thing in Python. As you will
see, the bug is not easily triggered when you run a Python version of
the program. But in Harmony Murphy's Law applies: if something can go
wrong, it will. Usually that is not a good thing, but in Harmony it is.
It allows you to find bugs in your concurrent programs much more easily
than with a conventional programming language.

## Exercises 

The following exercises are intended to show you that while it is just
as easy to write concurrent programs in Python, it is much easier to
find concurrency bugs using Harmony.


Harmony programs can usually be easily translated into Python. For
example, is a Python version of .

1.  Run using Python. Does the assertion fail?

2.  Using a script, run 1000 times. For example, if you are using the
    bash shell (in Linux or Mac OS X, say), you can do the following:

        for i in {1..1000}
        do
            python Up.py
        done

    If you're using Windows, the following batch script does the trick:

        FOR /L %%i IN (1, 1, 1000) DO python Up.py
        PAUSE

    How many times does the assertion fail (if any)?

is a version of that has each incrementer thread increment *count* `N`
times. Run 10 times (using Python). Report how many times the assertion
fails and what the value of *count* was for each of the failed runs.
Also experiment with lower values of `N`. How large does `N` need to be
for assertions to fail? (Try powers of 10 for `N`.)

Can you think of a fix to ? Try one or two different fixes and run them
through Harmony. Do not worry about having to come up with a correct fix
at this time---the important thing is to develop an understanding of
concurrency. (Also, you do not get to use a *lock*, yet.)

