
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
| Address |           compute address from two components |
| Apply |             pop *m* and *i* and apply *i* to *m*, pushing a value |
| Assert, Assert2 |   pop *b* and check that it is `True`. Assert2 also pops value to print |
| AtomicInc/Dec |     increment/decrement the atomic counter of this context |
| Continue |          no-op (but causes a context switch) |
| Choose |            choose an element from the set on top of the stack |
| Cut |               cut a set into its smallest element and the remainder |
| Del \[*v*\] |       delete shared variable *v* |
| DelVar \[*v*\] |    delete thread variable *v* |
| Dup |               duplicate the top element of the stack |
| Frame *m* *a* |     start method *m* with arguments *a*, initializing variables. |
| Go |                pop context and value, push value on context's stack, and add to context bag |
| IncVar *v* |        increment thread variable *v* |
| Invariant *end* |   code for invariant follows. Skip to *end* + 1 |
| Jump *p* |          set program counter to *p* |
| JumpCond *e* *p* |  pop expression and, if equal to *e*, set program counter to *p* |
| Load \[*v*\] |      push the value of a shared variable onto the stack |
| LoadVar \[*v*\] |   push the value of a thread variable onto the stack |
| Move *i* |          move stack element at offset *i* to top of the stack |
| $n$-ary *op* |      apply $n$-ary operator *op* to the top $n$ elements on the stack |
| Pop |               pop a value of the stack and discard it |
| Print |             pop a value and add to the print history |
| Push *c* |          push constant *c* onto the stack |
| ReadonlyInc/Dec |   increment/decrement the read-only counter of this context |
| Return |            pop return address, push `result`, and restore program counter |
| Sequential |        pop an address of a variable that has sequential consistency |
| SetIntLevel |       pop *e*, set interrupt level to *e*, and push old interrupt level |
| Spawn \[eternal\] | pop initial thread-local state, argument, and method and spawn a new context |
| Split |             pop tuple and push its elements |
| Stop \[*v*\] |      save context into shared variable *v* and remove from context bag |
| Store \[*v*\] |     pop a value from the stack and store it in a shared variable |
| StoreVar \[*v*\] |  pop a value from the stack and store it in a thread variable |
| Trap |              pop interrupt argument and method |

Clarifications:

-   The `Address` instruction expects two values on the stack. The top
    value must be an address value, representing a dictionary The other
    value must be a key into the dictionary. The instruction then
    computes the address of the given key.

-   Even though Harmony code does not allow taking addresses of thread
    variables, both shared and thread variables can have addresses.

-   The `Load`, `LoadVar`, `Del`, `DelVar`, and `Stop` instructions have
    an optional variable name: if omitted the top of the stack must
    contain the address of the variable.

-   `Store` and `StoreVar` instructions have an optional variable name.
    In both cases the value to be assigned is on the top of the stack.
    If the name is omitted, the address is underneath that value on the
    stack.

-   The effect of the `Apply` instructions depends much on *m*. If *m*
    is a dictionary, then `Apply` finds *i* in the dictionary and pushes
    the value. If *m* is a program counter, then `Apply` invokes method
    *m* by pushing the current program counter and setting the program
    counter to *m*. *m* is supposed to leave the result on the stack.

-   The `Frame` instruction pushes the value of the thread register
    (*i.e.*, the values of the thread variables) onto the stack. It
    initializes the `result` variable to `None`. The `Return`
    instruction restores the thread register by popping its value of the
    stack.

-   All method calls have exactly one argument, although it sometimes
    appears otherwise:

    -   *m*() invokes method *m* with the empty dictionary () as
        argument;

    -   *m*(*a*) invokes method *m* with argument *a*;

    -   *m*(*a*, *b*, *c*) invokes method *m* with tuple (*a*, *b*, *c*)
        as argument.

    The `Frame` instruction unpacks the argument to the method and
    places them into thread variables by the given names.

-   Every `Stop` instruction must immediately be followed by a
    `Continue` instruction.

-   There are two versions of `AtomicInc`: *lazy* or *eager*. When
    eager, an atomic section immediately causes a *switch point* (switch
    between threads). When lazy, the state change does not happen until
    the first `Load` `Store`, or `Print` instruction. If there are no
    such instructions, the atomic section may not even cause a switch
    point.

## Contexts and Threads 

A context captures the state of a thread. Each time the thread executes
an instruction, it goes from one context to another. All instructions
update the program counter (`Jump` instructions are not allowed to jump
to their own locations), and so no instruction leaves the context the
same. There may be multiple threads with the same state at the same
time. A context consists of the following:

  name                     the name of the main method that the thread is executing
  argument                 the argument given to the main method
  program counter          an integer value pointing into the code
  frame pointer            an integer value pointing into the stack
  atomic                   if non-zero, the thread is in atomic mode
  readonly                 if non-zero, the thread is in read-only mode
  stack                    a list of Harmony values
  method variables         a dictionary mapping strings (names of method variables) to values
  thread-local variables   a dictionary mapping strings (names of thread-local variables) to values
  stopped                  a boolean indicating if the context is stopped
  failure                  if not None, string that describes how the thread failed

Details:

-   The frame pointer points to the current *stack frame*, which
    consists of the caller's frame pointer and variables, the argument
    to the method, an "invocation type" (`normal`, `interrupt`, or
    `thread`), and the return address (in case of `normal`).

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

A formal specification of the Harmony Virtual Machine is well underway
but not yet completed. At this time, there is no support yet for bitwise
integer operations. Also, strings are limited to the printable
characters minus double quotes, back quotes, or backslashes. Given a
Harmony program, you can output the TLA+ specification for the program
using the following command:

    $ harmony -o program.tla program.hny

For most Harmony programs, including Peterson's algorithm and the Dining
Philosophers in this book, the result is complete enough to run through
the TLC model checker.
