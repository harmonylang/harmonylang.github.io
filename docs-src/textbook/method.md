
# Harmony Methods and Pointers 

A method *m* with argument *a* is invoked in its most basic form as
follows (assigning the result to *r*).
```
r = m a
```
That's right, no parentheses are required. In fact, if you invoke
*m*(*a*), the argument is (*a*), which is the same as *a*. If you invoke
*m*(), the argument is (), which is the empty tuple. If you invoke
*m*(*a*, *b*), the argument is (*a*, *b*), the tuple consisting of
values *a* and *b*.

You may note that all this looks familiar. Indeed, the syntax is the 
same as that for dictionaries and lists (see [Chapter 4](harmonymachine.md)).
Dictionaries, lists, and methods all map Harmony values to Harmony
values, and their syntax is indistinguishable. If `f` is a method, 
list, or dictionary, and `x` is some Harmony value, then
`f x`, `f(x)`, and `f[x]` are all the same expression in Harmony.

```python title="PetersonMethod.hny"
--8<-- "PetersonMethod.hny"
```

<figcaption>Figure 7.1 (<a href=https://harmony.cs.cornell.edu/code/PetersonMethod.hny>code/PetersonMethod.hny</a>): 
Peterson's Algorithm accessed through methods
</figcaption>

Harmony does not have a **return** statement. Using the `returns`
clause of `def`, a result variable can be declared, for example:
`def f() returns something`.  The result of the method should be
assigned to variable `something`. If there is no `returns` clause,
then (for backwards compatibility reasons) the method has a default
result variable called `result`.  The default value of `result` is
`None` for compatibility with Python.

Harmony also does not support **break** or **continue** statements in loops. One reason for
their absence is that, particularly in concurrent programming, such
control flow directions are highly error-prone. It's too easy to forget
to, say, release a lock when returning a value in the middle of a
method---a major source of bugs in practice.

Harmony is not an object-oriented language like Python is. In Python,
you can pass a reference to an object to a method, and that method can
then update the object. In Harmony, it is also sometimes convenient to
have a method update a shared variable specified as an argument. For
this, as mentioned in [Chapter 4](harmonymachine.md), each shared variable has an
*address*, itself a Harmony value. If *x* is a shared variable, then the
expression ?*x* is the address of *x*. If a variable contains an
address, we call that variable a *pointer*. If *p* is a pointer to a
shared variable, then the expression !*p* is the value of the shared
variable. In particular, !?*x* = *x*. This is similar to how C pointers
work (`*&`*x* = *x*).

Often, pointers point to dictionaries, and so if *p* is such a pointer,
then (!*p*).*field* would evaluate to the specified field in the
dictionary. Note that the parentheses in this expression are needed, as
!*p*.*field* would wrongly evaluate !(*p*.*field*). (!*p*).*field* is
such a common expression that, like C, Harmony supports the shorthand
*p*->*field*, which greatly improves readability.

Figure 7.1 again shows Peterson's algorithm, but this time
with methods defined to enter and exit the critical section. The name
*mutex* is often used to denote a variable or value that is used for
mutual exclusion. `P_mutex` is a method that returns a "mutex," which,
in this case, is a dictionary that contains Peterson's Algorithm's
shared memory state: a turn variable and two flags. Both methods
`P_enter` and `P_exit` take two arguments: a pointer to a mutex and the
thread identifier (0 or 1). *pm*->*turn* is the value of the
.*turn* key in the dictionary that *pm* points to.

You can put the first three methods in its own Harmony source file and
include it using the Harmony **import** statement. This would make the
code usable by multiple applications.

Finally, methods can have local variables. Method
variables are either mutable (writable) or immutable (read-only). The
arguments to a method and the bound variable (or variables) within a
**for** statement are immutable; the result variable is mutable. Using
the **var** statement, new mutable local variables can be declared. For
example, **var** $x = 3$ declares a new mutable local variable *x*. The
**let** statement allows declaring new immutable local variables. For
example: **let** $x = 3$: *y* $+$$=$ *x* adds 3 to the global variable
*y*. See for more information.


```python title="hanoi.hny"
--8<-- "hanoi.hny"
```

<figcaption>Figure 7.2 (<a href=https://harmony.cs.cornell.edu/code/hanoi.hny>code/hanoi.hny</a>): 
Towers of Hanoi </figcaption>

As an example of using **import** and **let**, Figure 7.2 solves the
*Towers of Hanoi* problem. If you are not familiar with this problem:
there are three towers with disks of varying sizes. In the initial
configuration, the first tower has three disks (of sizes 1, 2, and 3),
with the largest disk at the bottom, while the other two towers are
empty. You are allowed to move a top disk from one tower to another, but
you are not allowed to stack a larger disk on a smaller one. The
objective is to move the disks from the first tower to the third one.

The program uses the `list` module documented in . It has methods to
extract the *head* (first element) and the *tail* (remaining elements)
of a list. (The code is simple and available in `modules/list.hny`.) The
program tries valid moves at random until it finds a solution.
Curiously, the program then asserts `False`. This is to cause the model
checker to stop and output the trace. If you look in the output column
of the trace, you will find the minimal number of moves necessary to
solve the problem.

It is even cooler to remove that assertion and let Harmony generate all
possible solutions to the problem like so:

    $ harmony -o hanoi.png code/hanoi.hny

The resulting `hanoi.png` file contains a DFA describing the possible
solutions. It is a little too big to include here, but well worth
looking at.


```python title="clock.hny"
--8<-- "clock.hny"
```

<figcaption>Figure 7.3 (<a href=https://harmony.cs.cornell.edu/code/clock.hny>code/clock.hny</a>): 
Harmony program that finds page replacement anomalies
</figcaption>

If you are ready to learn about how locks are implemented in practice,
you can now skip the rest of this chapter. But if you would like to see
a cool example of using the concepts introduced in this chapter, hang on
for a sequential Harmony program that finds anomalies in page
replacement algorithms. In 1969, Bélády et al. published a
paper that showed that making a cache larger does not
necessarily lead to a higher hit ratio. He showed this for a scenario
using a FIFO replacement policy when the cache is full. The program in
Figure 7.3 will find exactly the same scenario if you define `FIFO`
to be `True`. Moreover, if you define `FIFO` to be `False`, it will find
a scenario for the CLOCK replacement policy, often used in
modern operating systems.

In this program, `CLOCK` maintains the state of a cache (in practice,
typically pages in memory). The set *recent* maintains whether an access
to the cache for a particular reference was recent or not. (It is not
used if `FIFO` is `True`.) The integer *misses* maintains the number of
cache misses. Method `ref`(*ck*, *x*) is invoked when *x* is referenced
and checked against the cache *ck*.

The program declares two caches: one with 3 entries (*clock3*) and one
with 4 entries (*clock4*). The interesting part is in the last block of
code. It runs every sequence of references of up to 100 entries, using
references in the range 1 through 5. Note that all the constants chosen
in this program (3, 4, 5, 100) are the result of some
experimentation---you can try other ones. To reduce the search space,
the first four references are pinned to 1, 2, 3, and 4. Further reducing
the search space, the program never repeats the same reference twice in
a row (using the local variable *last*).

The two things to note here is the use of the **choose** expression and
the **assert** statement. Using **choose**, we are able to express
searching through all possible strings of references without a
complicated nested iteration. Using `assert`, we are able to express the
anomaly we are looking for.

In case you want to check if you get the right results. For `FIFO`, the
program finds the same anomaly that Bélády et al. found: 1 2 3 4 1 2 5 1
2 3 4 5. For the `CLOCK` algorithm the program actually finds a shorter
reference string: 1 2 3 4 2 1 2 5 1 2.

## Exercises 


**7.1** (This is just for fun or exercise as it is not a concurrent or
distributed problem.) Implement a Harmony program that finds solutions
to the "cabbage, goat, and wolf" problem. In this problem, a person
accompanied by these three items has to cross a stream in a small boat,
but can only take one item at a time. So, the person has to cross back
and forth several times, leaving two items on one or the other shore by
themselves. Unfortunately, if left to themselves, the goat would eat the
cabbage and the wolf would eat the goat. What crossings does the person
need to make in order not to lose any items?

