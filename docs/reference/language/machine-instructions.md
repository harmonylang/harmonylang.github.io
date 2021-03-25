# List of Machine Instructions

| Instruction | Description |
| ------ | ------- |
| `Address` | compute address from two components |
| `Apply` | pop `m` and `i` and `apply` `i` to `m`, pushing a value |
| `Assert, Assert2` | pop `b` and check that it is True. Assert2 also pops value to print |
| `AtomicInc/Dec` | increment/decrement the atomic counter of this context |
| `Continue` | no-op (but causes a context switch) |
| `Choose` | choose an element from the set on top of the stack |
| `Cut` | cut a set into its smallest element and the remainder |
| `Del [v]` | delete shared variable `v` |
| `DelVar [v]` | delete thread variable `v` |
| `Dup` | duplicate the top element of the stack |
| `Frame m a` | start method m with arguments `a`, initializing variables. |
| `Go` | pop context and value, push value on context's stack, and add to context bag |
| `IncVar v` | increment thread variable `v` |
| `Jump p` | set program counter to `p` |
| `JumpCond e p` | pop expression and, if equal to `e`, set program counter to `p` |
| `Load [v]` | push the value of a shared variable onto the stack |
| `LoadVar [v]` | push the value of a thread variable onto the stack |
| `Move i` | move stack element at offset `i` to top of the stack |
| `n-ary op` | `apply` *n*-ary operator `op` to the top `n` elements on the stack |
| `Pop` | pop a value of the stack and discard it |
| `Push c` | push constant `c` onto the stack |
| `ReadonlyInc/Dec` | increment/decrement the read-only counter of this context |
| `Return` | pop return address, push result, and restore program counter |
| `Sequential` | pop an address of a variable that has sequential consistency |
| `SetIntLevel` | pop `e`, set interrupt level to `e`, and push old interrupt level |
| `Spawn` | pop initial thread-local state, argument, and method and spawn a new context |
| `Split` | pop tuple and push its elements |
| `Stop [v]` | save context into shared variable `v` and remove from context bag |
| `Store [v]` | pop a value from the stack and store it in a shared variable |
| `StoreVar [v]` | pop a value from the stack and store it in a thread variable |
| `Trap` | pop interrupt argument and method |

<br />

### Clarifications

- The `Address` instruction expects two values on the stack. The top value must be an address value, representing a dictionary The other value must be a key into the dictionary. The instruction then computes the address of the given key.

- Even though Harmony code does not allow taking addresses of thread variables, both shared and thread variables can have addresses.

- The `Load`, `LoadVar`, `Del`, `DelVar`, and `Stop` instructions have an optional variable name: if omitted the top of the stack must contain the address of the variable.

- `Store` and `StoreVar` instructions have an optional variable name. In both cases the value to be assigned is on the top of the stack. If the name is omitted, the address is underneath that value on the stack.

- The effect of the `Apply` instructions depends much on `m`. If `m` is a dictionary, then `Apply` finds `i` in the dictionary and pushes the value. If `m` is a program counter, then `Apply` invokes method `m` by pushing the current program counter and setting the program counter to `m`. `m` is supposed to leave the result on the stack.

- The `Frame` instruction pushes the value of the thread register (`i.e.`, the values of the thread variables) onto the stack. It initializes the `result` variable to the empty dictionary. The Return instruction restores the thread register by popping its value of the stack.

- All method calls have exactly one argument, although it sometimes appears otherwise:

    - `m()` invokes method m with the empty dictionary () as argument
    
    - `m(a)` invokes method m with argument `a`

    - `m(a, b, c)` invokes method m with tuple (`a`, `b`, `c`) as argument

    The `Frame` instruction unpacks the argument to the method and places them into thread variables by the given names.

- Every `Stop` instruction must immediately be followed by a `Continue` instruction.