
# How Harmony Works 

This appendix gives a very brief overview of how Harmony works. In a
nutshell, Harmony goes through the following three phases:

1.  The Harmony *compiler* turns your Harmony program into bytecode. A
    recursive descent parser and code generator written in Python (see
    `harmony.py`) turns an `x.hny` program into `x.hvm`, a JSON file
    containing the corresponding bytecode.

2.  The Harmony *model checker* evaluates the state space that the
    program (now in bytecode) can generate. The model checker is written
    in C as it needs to be highly efficient (see `charm.c`). The model
    checker starts from the initial state, and then, iteratively, checks
    for each state that it has found what next steps are possible and
    generates the next states using the Harmony virtual machine (). If
    the model is finite, eventually the model checker will generate a
    graph with all possible states. If there is a problematic path in
    this graph (see below), then it will report the shortest such path
    in the `x.hco` output file in JSON format.

3.  The `x.hco` output file is translated twice by `harmony.py`. There
    is a so-called *brief output* that is written to standard output.
    The rest depends on whether there was a problem with the execution
    or not. If there was a problem, the more comprehensive output is
    placed in the `x.htm` HTML output file, allowing you to navigate the
    problematic path and all the details of each of the states on the
    path. If not, a DFA of the print behavior is generated and compared
    with a provided DFA if specified with the `-B` flag.

## Compiler

The Harmony compiler, in order to stay true to the Harmony source
program, does not do much in the way of optimizations. The main
optimizations that it does are:

-   Constant folding: (simple) expressions consisting only of constants
    are evaluated by the compiler rather than by the model checker;

-   Jump threading: Harmony eliminates jump to jump instructions;

-   Dead variable elimination: Harmony removes method variables that are
    no longer in use from the state in order to reduce the state space
    to be explored.

## Model Checker

The Harmony model checker, called *Charm*, takes the output from the
compiler and explores the entire state space in breadth-first order.
Even though Harmony does not really support input, there are three
sources of non-determinism that make this exploration non-trivial:

-   **choose** *expressions*: Harmony's ability to let the program
    choose a value from a set;

-   *thread interleaving*: different threads run pseudo-concurrently
    with their instructions interleaved in arbitrary ways;

-   *interrupts*: Harmony programs can set interrupts that can go off at
    arbitrary times.

A thread can be in *atomic* mode or not. In atomic mode, the execution
of the thread is not interleaved with other threads. A thread can also
be in *read-only* mode or not. In read-only mode, the thread cannot
write or deleted shared variables.

Charm has some tricks to significantly reduce the state space to
explore.

-   A thread can have local state (program counter, stack, method
    variables, and thread-local state variables). That state is called
    the *context* of the thread. The context of a thread cannot be
    accessed by other threads, nor by **invariant** or **finally** 
    statements. So, the model checker only interleaves threads at
    **Load**, **Store**, and **Del** instructions where a thread
    interacts with global variables.

-   Threads are anonymous, and therefore two or more threads can have
    the same context. The state of the model checker therefore maintains
    a *bag* (multiset) of contexts rather are than a *set* of contexts.
    Thus even if there are hundreds of threads, there may be only tens
    of possible context states.

That said, *state space explosion* is still a possibility, and Harmony
programmers should keep this in mind when writing and testing their
programs. Do not be too ambitious: start with small tests and gradually
build them up as necessary.

The model checker stops either when it finds a failing execution or when
it has explored the entire state space, whichever comes first. An
execution can fail for a variety of reasons:

-   An invariant failing: Harmony evaluates all invariants in all states
    that if finds---if one fails, Harmony stops further exploration;

-   An assertion failing;

-   A behavior violation: this is when the sequence of printed values
    are not recognized by the provided DFA (using the `-B` flag);

-   A *silly* error: this includes reading variables that have not been
    assigned, trying to add a set to an integer, taking the length of
    something that is not a set of a dictionary, and so on;

-   An infinite loop: a thread goes into an infinite loop without
    accessing shared variables.

## Model Checker Output Analysis

The output of the model checker is a graph (a so-called *Kripke
structure*) that is typically very large. If some execution failed, then
Harmony will simply report the path of that failing execution. But
otherwise there may be the following outcomes:

-   No issues: no failing executions and each program can terminate;

-   Non-terminating states: some executions lead to some form of
    deadlock or other issue that causes some (non-eternal) threads not
    to be able to terminate;

-   Race conditions: there are executions in which two threads access
    the same shared state variable, with at least one of those accesses
    being a **Store** operation;

-   Busy waiting: executions in which threads are actively waiting for
    some condition, usually by releasing and reacquiring locks.

In order to diagnose these outcomes, Harmony must analyze the graph.

The first thing that Harmony does is to locate non-terminating states,
if any. To do this, Harmony first determines the *strongly connected
components* of the graph using Kosaraju's algorithm. A component
(subgraph) of a graph is strongly connected if each vertex (state) in
the component can be reached from each other vertex. The components then
form a Directed Acyclic Graph (DAG). The DAG is easier to analyze than
the original graph. One can easily determine the sink components (the
components with no outgoing edges). If such a component has non-eternal
threads in it, then each state in that component is a non-terminating
state.

To find race conditions, the model checker looks in the graph for states
in which there are multiple threads that can make a step. If there is a
step in which multiple threads access the same shared variable, at least
one of those accesses is a store operation, and at least one of those
threads is not in atomic mode, then Harmony reports the shortest path to
such a state.

To show how Harmony detects busy waiting, we will first show how Harmony
determines if a thread is blocked or not. A thread is considered blocked
if it cannot terminate without the help of another thread. For example,
a thread waiting for a lock is blocked and cannot terminate until
another thread releases the lock. Determining whether a thread is
blocked in a particular state can be done within the confines of the
connected component: the analyzer tries all possible executions of the
thread. If it cannot "escape" the connected component by doing so, it is
considered blocked. A thread is considered *busy waiting* if it is
blocked, but it is also changing the shared state while doing so. A
thread that is waiting on a spinlock only observes the state.

In the output, each thread has a unique identifier: `T0` is the
initialization thread; `T`$n$ is the $n^{th}$ spawned thread that
executes. This seems to contradict the fact that Harmony threads are
anonymous. The output analyzer assigns these identifiers *a posteriori*
to the threads in the state graph by keeping track, along the reported
execution path, what state each thread is in. So, by examining the
initial context of the thread that is running from some particular
state, it can determine if that context corresponds to the current
context of some thread that ran previously or if the context belongs to
a new thread that has not run before.

If there are no issues, Harmony also generates a DFA of the print
behavior. Starting with the original state graph or Kripke structure,
the edges are inspected. If there are multiple print operations on an
edge, additional states are inserted so that there are either 0 or 1
print operations on an edge. This graph of nodes (states) and edges
(transitions) forms a Non-deterministic Finite Automaton (NFA) with
$\epsilon$-transitions (transitions without print operations). Harmony
turns the NFA into a DFA and by default also minimizes the DFA (although
not strictly necxessary). The DFA can be fed into another run of the
model checker to check that its print operations are consistent with the
provided DFA.
