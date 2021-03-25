# Contexts and Threads

A context captures the state of a thread. Each time the thread executes an instruction, it goes from one context to another. All instructions update the program counter (`Jump` instructions are not allowed to jump to their own locations), and so no instruction leaves the context the same. There may be multiple threads with the same state at the same time. A context consists of the following:

| Variable | Description |
| ------ | ------- |
| `name` | the name of the main method that the thread is executing |
| `argument` | the argument given to the main method |
| `program counter` | an integer value pointing into the code |
| `frame pointer` | an integer value pointing into the stack |
| `atomic` | if non-zero, the thread is in atomic mode |
| `readonly` | if non-zero, the thread is in read-only mode |
| `stack` | a list of Harmony values |
| `method variables` | a dictionary mapping atoms (names of method variables) to values |
| `thread-local variables` | a dictionary mapping atoms (names of thread-local variables) to values |
| `stopped` | a boolean indicating if the context is stopped |
| `failure` | if not None, string that describes how the thread failed |

<br />

### Details

- The frame pointer points to the current *stack frame*, which consists of the caller's frame pointer and variables, the argument to the method, an "invocation type atom" (`normal`, `interrupt`, or `thread`), and the return address (in case of `normal`).

- A thread terminates when it reaches the `Return` instruction of the top-level method (when the stack frame is of type `thread`) or when it hits an exception. Exceptions include divide by zero, reading a non-existent key in a dictionary, accessing a non-existent variable, as well as when an assertion fails;

- The execution of a thread in *atomic mode* does not get interleaved with that of other threads.

- The execution of a thread in *read-only mode* is not allowed to update shared variables of spawn threads.

The register of a thread always contains a dictionary, mapping atoms to arbitrary values. The atoms correspond to the variable names in a Harmony program.