
# Spinlock 

Peterson's algorithm implements locks, but it is not efficient,
especially if generalized to multiple threads. Worse, Peterson relies on
load and store operations to be executed atomically, but this may not be
the case. There are a variety of possible reasons for this.

-   Variables may have more bits than the processor's data bus. For
    example, variables may have 32 bits, but the data bus may only have
    16 bits. Thus to store or load a variable takes two 16-bit
    operations each. Take, for example, a variable that has value
    0xFFFFFFFF, and consider a concurrent load and store operation on
    the variable. The store operation wants to clear the variable, but
    because it takes two store operations on the bus, the load operation
    may return either 0xFFFF0000 or 0x0000FFFF, a value that the
    variable never was supposed to have. This is the case even if the
    processor supports a 32-bit load or store machine instruction: on
    the data bus it is still two operations.

-   Modern processors sometimes re-orders load and store operations
    (out-of-order execution) for improved performance. On a sequential
    processor, the re-ordering is not a problem as the processor only
    re-orders operations on independent memory locations. However, as
    Example 6.3 showed, Peterson's algorithm breaks down if such
    seemingly independent operations are re-ordered. Some memory caches
    can also cause non-atomic behavior of memory when shared among
    multiple cores.

-   Even compilers, in their code generation, may make optimizations
    that can reorder operations, or even eliminate operations, on
    variables. For example, a compiler may decide that it is unnecessary
    to read the same variable more than once, because how could it
    possibly change if there are no store operations in between?

Peterson's algorithm relies on a *sequential consistent memory model*
and hence the **sequential** statement: without it Harmony will complain
about data races. More precisely, the **sequential** statement says that
the program relies on memory load and store instructions operating on
the indicated variables to be performed sequentially, and that this
order should be consistent with the order of operations invoked on each
thread. The default memory models of C and Java are not sequentially
consistent. The unfortunately named **volatile** keyword in Java has a
similar function as Harmony's **sequential** keyword. Like many
constructions in Java, its `volatile` keyword was borrowed from C and
C++. However, in C and C++, they do *not* provide sequential
consistency, and one cannot implement Peterson's algorithm in C or C++
directly.

For proper synchronization, multi-core processors provide so-called
*atomic instructions*: special machine instructions that can read memory
and then write it in an indivisible step. While the HVM does not have
any specific built-in atomic instructions besides loading and storing
variables, it does have support for executing multiple instructions
atomically. Any Harmony statement can be made atomic by placing either a
label in front of it or the keyword **atomically**. We can use atomic
statements to implement a wide variety of atomic operations. For
example, we could fix the program in Figure 3.2 by constructing an
atomic increment operation for a counter, like so:


```python
def atomic_inc(ptr):
    atomically !ptr += 1
    
count = 0
atomic_inc(?count)
```

To support implementing locks, many CPUs have an atomic "test-and-set"
(TAS) operation. Method `test_and_set` in Figure 9.1 shows its
specification. Here *s* points to a shared boolean variable and *p* to a
private boolean variable, belonging to some thread. The operation copies
the value of the shared variable to the private variable (the "test")
and then sets the shared variable to `True` ("set").

```python title="spinlock.hny"
const N = 3
shared = False
private = [ True, ] * N
invariant len(x for x in [shared,] + private where not x) <= 1

def test_and_set(s, p):
    atomically:
        !p = !s
        !s = True

def clear(s):
    assert !s
    atomically !s = False

def thread(self):
    while choose({ False, True }):
        # Enter critical section
        while private[self]:
            test_and_set(?shared, ?private[self])
        # Critical section
        cs: assert (not private[self]) and (countLabel(cs) == 1)
        # Leave critical section
        private[self] = True
        clear(?shared)
for i in {0..N-1}:
    spawn thread(i)
```

<figcaption>Figure 9.1 (<a href=https://harmony.cs.cornell.edu/code/spinlock.hny>code/spinlock.hny</a>): 
Mutual Exclusion using a "spinlock" based on test-and-set
</figcaption>

Figure 9.1 goes on to implement mutual exclusion for a set of `N`
threads. The approach is called *spinlock*, because each thread is
"spinning" (executing a tight loop) until it can acquire the lock. The
program uses `N` + 1 boolean variables. Variable *shared* is initialized
to `False` while *private*}\[*i*\] for each thread *i* is initialized to
`True`.

An important invariant, $\mathcal{I}_1$, of the program is that at any
time at most one of these variables is `False`. Another invariant,
$\mathcal{I}_2(i)$, is that if thread *i* is in the critical section,
then *private*}\[*i*\] = `False`. Between the two (i.e.,
$\mathcal{I}_1 \land \forall i: \mathcal{I}_2(i)$), it is clear that
only one thread can be in the critical section at the same time.

To see that invariant $\mathcal{I}_1$ is maintained, note that !*p* =
`True` upon entry of `test_and_set` (because of the condition on the
**while** loop that the `test_and_set` method is invoked in). There are
two cases:

1.  !*s* is `False` upon entry to `test_and_set`. Then upon exit !*p* =
    `False` and !*s* = `True`, maintaining the invariant.

2.  !*s* is `True` upon entry to `test_and_set`. Then upon exit nothing
    has changed, maintaining the invariant.

Invariant $\mathcal{I}_1$ is also easy to verify for exiting the
critical section because we can assume, by the induction hypothesis,
that *private*\[*i*\] is `True` just before exiting the critical
section. Invariant $\mathcal{I}_2(i)$ is obvious as (i) thread *i* only
proceeds to the critical section if *private*\[*i*\] is `False`, and
(ii) no other thread modifies *private*\[*i*\].

Harmony can check these invariants as well. $\mathcal{I}_2(i)$ is
checked by the **assert** statement. But how would one go about checking
an invariant like $\mathcal{I}_1$? Invariants must hold for every state.
For $\mathcal{I}_2$ we only need an assertion at label `cs` because the
premise is that there is a thread at that label. However, we would like
to check $\mathcal{I}_1$ in *every state* (after the variables have been
initialized). Harmony supports checking such invariants using the
`invariant` keyword. The expression counts the number of `False` values
and checks that the result is less than or equal to 1. Harmony checks
the expression in every reachable state.

## Exercises 


**9.1** Implement an atomic swap operation. It should take two pointer arguments and swap the values.

**9.2** Implement a spinlock using the atomic swap operation.

**9.3** For the solution to Example 9.1, write out the invariants that need to
hold and check them using Harmony.

