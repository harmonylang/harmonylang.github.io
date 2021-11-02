
# On Concurrent Programming

Programming with concurrency is hard. On the one hand concurrency can
make programs faster than sequential ones, but having multiple threads
read and update shared variables concurrently and synchronize with one
another makes programs more complicated than programs where only one
thing happens at a time. Why are concurrent programs more complicated
than sequential ones? There are, at least, two reasons:

-   The execution of a sequential program is mostly *deterministic*. If
    you run it twice with the same input, the same output will be
    produced. Bugs are typically easily reproducible and easy to track
    down, for example by instrumenting the program. On the other hand,
    the output of running concurrent programs depends on how the
    execution of the various threads are *interleaved*. Some bugs may
    occur only occasionally and may never occur when the program is
    instrumented to find them (so-called *Heisenbugs*---overhead caused
    by instrumentation leads to timing changes that makes such bugs less
    likely to occur).

-   In a sequential program, each statement and each function can be
    thought of as happening *atomically* (indivisibly) because there is
    no other activity interfering with their execution. Even though a
    statement or function may be compiled into multiple machine
    instructions, they are executed back-to-back until completion. Not
    so with a concurrent program, where other threads may update memory
    locations while a statement or function is being executed.

The lack of determinism and atomicity in concurrent programs make them
not only hard to reason about, but also hard to test. Running the same
test of concurrent code twice is likely to produce two different
results. More problematically, a test may trigger a bug only for certain
"lucky" executions. Due to the probabilistic nature of concurrent code,
some bugs may be highly unlikely to get triggered even when running a
test millions of times. And even if a bug does get triggered, the source
of the bug may be hard to find because it is hard to reproduce.

This book is intended to help people with understanding and developing
concurrent code, which includes programs for distributed systems. In
particular, it uses a new tool called Harmony that helps with *testing*
concurrent code. The approach is based on *model checking*:
instead of relying on luck, Harmony will run *all possible executions*
of a particular test program. So, even if a bug is unlikely to occur, if
the test *can* expose the bug it *will*. Moreover, if the bug is found,
the model checker precisely shows how to trigger the bug in the smallest
number of steps.

Model checking is not a replacement for formal verification. Formal
verification proves that a program is correct. Model checking only
verifies that a program is correct for some *model*. Think of a model as
a test program. Because model checking tries every possible execution,
the test program needs to be simple. Otherwise it may take longer than
we care to wait for or run out of memory. In particular, the model needs
to have a relatively small number of reachable states.

If model checking does not prove a program correct, why is it useful? To
answer that question, let us consider a sorting algorithm. Suppose we
create a test program, a model, that tries sorting *all* lists of up to
five numbers chosen from the set { 1, 2, 3, 4, 5 }. Model checking
proves that for those particular scenarios the sorting algorithm works:
the output is a sorted permutation of the input. In some sense it is an
excellent test: it will have considered all *corner cases*, including
lists where all numbers are the same, lists that are already sorted or
reversely sorted, etc. If there is a bug in the sorting algorithm, most
likely it would be triggered and the model checker would produce a
scenario that would make it easy to find the source of the bug.

However, if the model checker does not find any bugs, we do not know for
sure that the algorithm works for lists of more than five numbers or for
lists that have values other than the numbers 1 through 5. Still, we
would expect that the likelihood that there are bugs remaining in the
sorting algorithm is small. That said, it would be easy to write a
program that sorts all lists of up to five numbers correctly but fails
to do so for a list of 6 numbers. (Hint: simply use an **if**
statement.)

While model checking does not in general prove an algorithm correct, it
can help with proving an algorithm correct. The reason is that many
correctness properties can be proved using *invariants*: predicates that
must hold for every state in the execution of a program. A model checker
can find violations of proposed invariants when evaluating a model and
provide valuable early feedback to somebody who is trying to construct a
proof, even an informal one. We will include examples of such invariants
as they often provide excellent insight into why a particular algorithm
works.

So, what is Harmony? Harmony is a concurrent programming language. It
was designed to teach the basics of concurrent and distributed
programming, but it is also useful for testing new concurrent algorithms
or even sequential and distributed algorithms. Harmony programs are not
intended to be "run" like programs in most other programming
languages---instead Harmony programs are model checked to test that the
program has certain desirable properties and does not suffer from bugs.
Interestingly, Harmony does not have input/output statements, so there
is no "Hello World" program.

The syntax and semantics of Harmony is similar to that of Python. Python
is familiar to many programmers and is easy to learn and use. We will
assume that the reader is familiar with the basics of Python
programming. We also will assume that the reader understands some basics
of machine architecture and how programs are executed. For example, we
assume that the reader is familiar with the concepts of CPU, memory,
register, stack, and machine instructions.

Harmony is heavily influenced by Leslie Lamport's work on TLA+, TLC, and
PlusCal, Gerard Holzmann's work on Promela and
SPIN, and University of Washington's DSLabs system.
Harmony is designed to have a lower learning curve than those systems,
but is not as powerful. When you finish this book and want to learn
more, we strongly encourage checking those out. Another excellent
resource is Fred Schneider's book "On Concurrent
Programming". (This chapter is named after that book.)

The book proceeds as follows:

-   introduces the Harmony programming language, as it provides the
    language for presenting synchronization problems and solutions.

-   illustrates the problem of concurrent programming through a simple
    example in which two threads are concurrently incrementing a
    counter.

-   presents the Harmony virtual machine to understand the problem
    underlying concurrency better.

-   introduces the concept of a *critical section* and presents various
    flawed implementations of critical sections to demonstrate that
    implementing a critical section is not trivial.

-   introduces *Peterson's Algorithm*, an elegant (although not very
    efficient or practical) solution to implementating a critical
    section.

-   gives some more details on the Harmony language needed for the rest
    of the book.

-   talks about how Harmony can be used as a specification language. It
    introduces how can can specify atomic constructs.

-   introduces atomic *locks* for implemented critical sections.

-   looks at various ways in which the lock specification in can be
    implemented.

-   gives an introduction to building concurrent data structures.

-   discusses approaches to testing concurrent code in Harmony.

-   instead goes into how to find a bug in concurrent code using the
    Harmony output.

-   talks about threads having to wait for certain conditions. As
    examples, it presents the reader/writer lock problem and the bounded
    buffer problem.

-   presents *Split Binary Semaphores*, a general technique for solving
    synchronization problems.

-   talks about *starvation*: the problem that in some synchronization
    approaches threads may not be able to get access to a resource they
    need.

-   presents *monitors* and *condition variables*, another approach to
    thread synchronication.

-   describes *deadlock* where a set of threads are indefinitely waiting
    for one another to release a resource.

-   presents the *actor model* and *message passing* as an approach to
    synchronization.

-   describes *barrier synchronization*, useful in high-performance
    computing applications such as parallel simulations.

-   discusses how to handle interrupts, a problem closely related
    to---but not the same as---synchronizing threads.

-   introduces *non-blocking* or *wait-free* synchronization algorithms,
    which prevent threads waiting for one another more than a bounded
    number of steps.

-   presents a problem and a solution to the distributed systems problem
    of having two threads communicate reliably over an unreliable
    network.

-   presents a protocol for electing a leader on a ring of processors,
    where each processor is uniquely identified and only knows its
    successor on the ring.

-   describes atomic database transactions and the two-phase commit
    protocol used to implement them.

-   describes *state machine replication* and the *chain replication*
    protocol to support replication.

-   presents a protocol for a fault-tolerant replicated object that
    supports only read and write operations.

-   demonstrates a fault-tolerant distributed consensus algorithm (aka
    protocol) expressed in Harmony.

-   shows how one can specify and check the well-known Paxos consensus
    protocol.

-   demonstrates finding a bug in the original Needham-Schroeder
    authentication protocol.

The appendices contain various details about Harmony itself, including
an appendix that explains how Harmony works and an appendix on
installing and running Harmony.
