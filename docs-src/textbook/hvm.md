
# The Harmony Virtual Machine 

The Harmony Virtual Machine (HVM, [Chapter 4](harmonymachine.md)) has the
following state:

  code        a list of HVM machine instructions
  variables   a dictionary mapping strings to values
  ctxbag      a bag of runnable contexts
  stopbag     a bag of stopped contexts
  choosing    if not `None`, indicates a context that is choosing

There is initially a single context with name `__init__`() and program
counter 0. It starts executing in atomic mode until it finishes
executing the last `Return` instruction. Other threads, created through
**spawn** statements, do not start executing until then.

A *step* is the execution of a single HVM machine instruction by a
context. Each step generates a new state. When there are multiple
contexts, the HVM can interleave them. However, trying to interleave
every step would be needlessly expensive, as many steps involve changes
to a context that are invisible to other contexts.

A *stride* can involve multiple steps. The following instructions start
a new stride: `Load`, `Store`, `AtomicInc`, and `Continue`. The HVM
interleaves stides, not steps. Like steps, each stride involves a single
context. Unlike a step, a stride can leave the state unchanged (because
its steps lead back to where the stride started).

Executing a Harmony program results in a graph where the nodes are
Harmony states and the edges are strides. When a state is `choosing`,
the edges from that state are by a single context, one for each choice.
If not, the edges from the state are one per context.

Consecutive strides by the same thread are called a *turn*. Each state
maintains the shortest path to it from the initial state in terms of
turns. The diameter of the graph is the length of the longest path found
in terms of turns.

If some states have a problem, the state with the shortest path is
reported. Problematic states include states that experienced exceptions.
If there are no exceptions, Harmony computes the strongly connected
components (SCCs) of the graph (the number of such components are
printed as part of the output). The sink SCCs should each consist of a
terminal state without any threads. If not, again the state with the
shortest path is reported.

If there are no problematic states, Harmony reports "no issues found"
and outputs in the HTML file the state with the longest path.

## Machine Instructions 

|       |       |
| ------ | ------- |
| Apply *m* |                call method *m* |
| Assert, Assert2 |          pop *b* and check that it is `True`. Assert2 also pops value to print |
| AtomicInc/Dec |            increment/decrement the atomic counter of this context |
| Continue |                 no-op (but causes a context switch) |
| Choose |                   choose an element from the set on top of the stack |
| Cut |                      retrieve an element from a iterable type |
| Del \[*v*\] |              delete shared variable *v* |
| DelVar \[*v*\] |           delete thread variable *v* |
| Dup |                      duplicate the top element of the stack |
| Finally *pc* |             *pc* is the pc of a lambda that returns a boolean |
| Frame *m* *a* |            start method *m* with arguments *a*, initializing variables. |
| Go |                       pop context and value, push value on context's stack, and add to context bag |
| Invariant *pc* |           *pc* is the pc of a lambda that takes arguments `pre, post` and returns a boolean |
| Jump *p* |                 set program counter to *p* |
| JumpCond *e* *p* |         pop expression and, if equal to *e*, set program counter to *p* |
| Load \[*v*\] |             evaluate the address on the stack (or load shared variable *v*) |
| LoadVar *v* |              push the value of a thread variable onto the stack |
| Move *i* |                 move stack element at offset *i* to top of the stack |
| $n$-ary *op* |             apply $n$-ary operator *op* to the top $n$ elements on the stack |
| Pop |                      pop a value of the stack and discard it |
| Print |                    pop a value and add to the print history |
| Push *c* |                 push constant *c* onto the stack |
| ReadonlyInc/Dec |          increment/decrement the read-only counter of this context |
| Return \[*v* \[, *d*\]\] | pop return address, push *v* (or default value *d*), and restore pc |
| Sequential |               pop an address of a variable that has sequential consistency |
| SetIntLevel |              pop *e*, set interrupt level to *e*, and push old interrupt level |
| Spawn \[eternal\] |        pop initial thread-local state, argument, and method and spawn a new context |
| Split |                    pop tuple and push its elements |
| Stop \[*v*\] |             save context into shared variable *v* and remove from context bag |
| Store \[*v*\] |            pop a value from the stack and store it in a shared variable |
| StoreVar \[*v*\] |         pop a value from the stack and store it in a thread variable |
| Trap |                     pop interrupt argument and method |

Clarifications:

-   Even though Harmony code does not allow taking addresses of thread
    variables, both shared and thread variables can have addresses.

-   The `Load`, `Del`, `DelVar`, and `Stop` instructions have
    an optional variable name: if omitted the top of the stack must
    contain the address of the variable.

-   The `Store` instruction has an optional variable name. The `StoreVar`
    instruction can even have a nested tuple of variable names such as `(a, (b, c))`.
    In both cases the value to be assigned is on the top of the stack.
    If the name is omitted, the address is underneath that value on the
    stack.

-   The `Frame` instruction pushes the value of the thread register
    (*i.e.*, the values of the thread variables) onto the stack. It
    initializes the `result` variable to `None`. The `Return`
    instruction restores the thread register by popping its value of the
    It initializes the `result` variable to `None`. stack.

-   All method calls have exactly one argument, although it sometimes
    appears otherwise:

    -   *m*() invokes method *m* with the empty dictionary () as
        argument;

    -   *m*(*a*) invokes method *m* with argument *a*;

    -   *m*(*a*, *b*, *c*) invokes method *m* with tuple (*a*, *b*, *c*)
        as argument.

    The `Frame` instruction unpacks the argument to the method and
    places them into thread variables by the given names.

-   The `Apply` instruction is unnecessary as it can be implemented using
    *2-ary Closure* and `Load`. However, method calls are frequent enough to
    warrant a faster mechanism, reducing model checking time.

-   The `Return` instruction has an optional result variable and default
    value.  If neither is specified, the result value is on top of the stack.
    Otherwise it tries to read the local variable.  If the variable does not
    exist, the default value is used or an error is thrown.

-   Every `Stop` instruction must immediately be followed by a
    `Continue` instruction.

-   There are two versions of `AtomicInc`: *lazy* or *eager*. When
    eager, an atomic section immediately causes a *switch point* (switch
    between threads). When lazy, the state change does not happen until
    the first `Load`, `Store`, or `Print` instruction. If there are no
    such instructions, the atomic section may not even cause a switch
    point.

The $n$-Ary instruction can have many different operators as
argument.
[Values](values.md) describes many of these operators, but some are used
internally only. The current set of such operators are as follows:

| Operator | Description |
| ------ | ------- |
| AddArg |    pop an argument and an address and push an address with the argument added |
| Closure |   pop an argument and a function and push an address with the single argument |
| DictAdd |   pop a value, a key, and a dictionary, and push an updated dictionary |
| ListAdd |   pop a value and a list, and push a new list with the given value added to the end|
| SetAdd |    pop a value and a set, and push a new set with the given value added |


## Addresses and Method Calls

Syntactically, Harmony does not make a distinction between methods calls
and indexing in Harmony dictionaries, lists, and strings.  This is because
Harmony makes all four look like functions that map a value to another value.
Beuses dynamic types, an expression like `a b` could mean that variable
`a` contains a program counter value and a method call must be made with
`b` as argument, or index `b` must be looked up in the `a` value.
Things can get more complicated for an expression like `a b c`, which
means `((a b) c)`: `a b` could return a program counter value or an
indexable Harmony value.

To deal with this, Harmony has a fairly unique address type.  An address
consists of a function and a list of arguments, which we will denote here
as $\langle f, [ a_0, a_1, ... ] \langle$.  If `a` is a shared variable,
then the address of `a b c` is $\langle \$, [$ "\`a\`", $b, c~]\rangle$, where
\$ is the function that maps the names of shared variables to their values.
In particular, \$("\`a\`") is the value of variable `a`.  A function can
also be a program counter value or an indexable Harmony value.  So, if `a` is
instead a method (i.e., a program counter constant), then the address would
by $\langle a, [b, c]\rangle$.  In the Harmony Virtual Machine, the \$ function
is represented as the program counter value $-1$.

To evaluate the Harmony expression `a b c`, Harmony first generates its address
(evaluating the expression left to right).  If `a` is a variable name, then
the function in the address depends on whether it is a shared variable or a thread
variable.  After the address is computed and pushed onto the stack, the
`Load` instruction evaluates the address, possibly in multiple steps
in an iterative manner.

A basic step of evaluating $\langle \mathit{function}, \mathit{arguments} \rangle$
proceeds as follows:

-   If *arguments* is empty, replace the address by *function*
      and proceed to the next instruction.

-   If *function* is an indexable Harmony value (list, string, or dictionary),
*arg* is the first argument, and *remainder* are the remaining arguments,
then replace the address by $\langle \mathit{function}[\mathit{arg}], \mathit{remainder} \rangle$ and repeat.

-   If *function* is \$, then replace the address by
$\langle \$[\mathit{arg}], \mathit{remainder} \rangle$ and repeat.

-   If *function* is a program counter value, then push *remainder*,
the current program counter (still pointing to the `Load` instruction), and
*arg* onto the stack and set the program counter to *function*.
The `Return` instruction pushes
$\langle r, \mathit{remainder} \rangle$, where $r$ is the result of the function,
and restores the program counter so it executes the `Load` instruction again.

The Harmony Virtual Machine can sometimes to multiple of these basic steps in one
big step.  For example, if `a b c` is a memory address, the `Load`
instruction will finish in a single atomic step.  Both `Load` and `Return`
are optimized in such ways.

## Contexts and Threads 

A context captures the state of a thread. Each time the thread executes
an instruction, it goes from one context to another. All instructions
update the program counter (`Jump` instructions are not allowed to jump
to their own locations), and so no instruction leaves the context the
same. There may be multiple threads with the same state at the same
time. A context consists of the following:

  program counter          an integer value pointing into the code
  atomic                   if non-zero, the thread is in atomic mode
  readonly                 if non-zero, the thread is in read-only mode
  stack                    a list of Harmony values
  method variables         a dictionary mapping strings (names of method variables) to values
  thread-local variables   a dictionary mapping strings (names of thread-local variables) to values
  stopped                  a boolean indicating if the context is stopped
  failure                  if not None, string that describes how the thread failed

Details:

-   A thread terminates when it reaches the `Return` instruction of the
    top-level method (when the stack frame is of type `thread`) or when
    it hits an exception. Exceptions include divide by zero, reading a
    non-existent key in a dictionary, accessing a non-existent variable,
    as well as when an assertion fails;

-   The execution of a thread in *atomic mode* does not get interleaved
    with that of other threads.

-   The execution of a thread in *read-only mode* is not allowed to
    update shared variables of spawn threads.

-   The register of a thread always contains a dictionary, mapping
    strings to arbitrary values. The strings correspond to the variable
    names in a Harmony program.

## Formal Specification 

Most of the Harmony Virtual Machine is specified in TLA+. Given a
Harmony program, you can output the TLA+ specification for the program
using the following command:

    $ harmony -o program.tla program.hny

For most Harmony programs, including Peterson's algorithm and the Dining
Philosophers in this book, the result is complete enough to run through
the TLC model checker.
