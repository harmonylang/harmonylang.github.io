# Statements

Harmony currently supports the following statements:

| Statement | Description |
| ------ | ------- |
| `lv = [lv =]... e` | `lv` is an lvalue and `e` is an expression |
| `lv [op] = e` | op is one of `+`,`-`,`*`,`/`,`//`,`%`,`&`,`|`,`^`,`and`, and `or` |
| `assert b [, e]` | `b` is a boolean. Optionally report value of expression `e` |
| `atomic: S` | `S` a list of statements |
| `await b` | `b` is a boolean |
| `const a = e` | `a` is a bounded variable, `e` is a constant expression |
| `def m a: S` | `m` is an identifier, `a` a bounded variable |
| `del lv` | delete |
| `for a[:b] in e [where c]: S` | `a` and `b` are a bounded variables, `e` is a set or dictionary |
| `from m import ...` | `m` identifies a module |
| `go c e` | `c`is a context, `e` is an expression |
| `if b: S else: S` | `b` is a boolean, `S` is a list of statements |
| `import m, ...` | `m` identifies a module |
| `invariant e` | `e` is an invariant |
| `let a = e [let ...]: S` | `a` is a bounded variable, `e` is an expression |
| `pass` | do nothing |
| `possibly b [, b, ...]` | each `b` is a boolean |
| `select a in e: S` | `a` is a bounded variable, `e` is a set, `S` a list of statements |
| `sequential v, ...` | `v` has sequential consistency |
| `spawn [eternal] m e [, t]` | `m` is a method, `e` is an expression, `t` is the thread-local state |
| `trap m e` | `m` is a method and `e` is an expression |
| `while b: S` | `b` is a boolean, `S` a list of statements |

<br />

## B.1 Single expression evaluation

Any expression by itself can be used as a statement. The most common form of this is a function application, for example:f(). This statement evaluates f() but ignores its result. It is equivalent to the assignment statement -= f().

## B.2 Assignment

The statement x = 3 changes the state by assigning 3 to variable x (assuming x was not already 3). x may be a local variable or a shared variable. The statement x = y = 3 first updates y, then x. The statement x[f()] = y[g()] = h() first computes the address of x[f()], then computes the address of y[g()], then evaluates h(), then assigns the resulting value to y[g()] (using its previously computed address), and finally assigns the same value to x[f()] (again using its previously computed address). The statement a, b = c assumes that c is a tuple with two values. It first evaluates the addresses of a and b and first assigns to the latter and then the former. If c is not a tuple with two values, then Harmony will report an error.
Assigning to evaluates the righthand side expression but is otherwise a no-op. The statement x += 3 loads x, adds 3, and then stores the results in x. In this case, it is equivalent to x = x + 3. However, in general this is not so. For example, x[f()] += 3 only evaluates f() once. Unlike Python, however, x += [3,] is equivalent to x = x + [3,] in Harmony. (In Python, the following two compound statements lead to different results fory: x = y = []; x += [3] and x = y = []; x = x + [3].)

## B.3 `assert`

The statement `assert` b evaluates b and reports an error if b is false. It should be considered a no-op — it is part of the specification, not part of the implementation of the algorithm. In particular, it specifies an invariant: whenever the program counter is at the location where the `assert` statement is, then b is always true. If b is an expression, then it is evaluated atomically. Moreover, the expression is not allowed to change the state. If it does change the state, Harmony will report an error as well. As in Python, you can specify an additional expression: `assert` b, e. The value of e will be reported as part of the error should b evaluate to false.

## B.4 `atomic`

The statement `atomic` S<sub>1</sub>; S<sub>2</sub>; ... evaluates statements  S<sub>1</sub>, S<sub>2</sub>, ... atomically in that no other threads can run while this `atomic` block is executing. Typically an `atomic` block runs to completion before any other thread can run. The only exception to this is if the `atomic` block executes a `stop` expression. In this case, another thread can run. When the original thread is resumed (using a `go` statement), it is once again atomically executing. The `atomic` statement is useful for implementing synchronization primitives such as test-and-set. It is also useful for testing. It is not a replacement for lock/unlock, and should not generally be used for synchronization otherwise. Lock/unlock does allow other threads to run concurrently — just not in the same critical section.

## B.5 `await`

The statement `await` b is equivalent to while !b: pass. It is intended to improve readability of your code.

## B.6 `const`

The expression `const` N = 3 introduces a new constant N with the value 3. Evaluating N does not lead to loading from a memory location. The assignment can be overridden with the -c flag: harmony -c N = 4 executes the model checker with 4 assigned to N instead of 3. Harmony also supports `const` N, M = 3, 4, which assigns 3 to N and 4 to M. Harmony has limited support for constant folding. For example, `const` N = 3 + 4 assigns value 7 to constant N.

## B.7 `def`

The statement `def` m a: S<sub>1</sub>; S<sub>2</sub>: ... defines a new program counter constant m referring to a method that takes an argument a and executes the statements S<sub>1</sub>, S<sub>2</sub>, .... The argument a can be a tuple pattern similar to those used in `let` and `for` statements. Examples include (), (x,), (x, y), and (x,(y, z)). The given local variable names variable names are assigned upon application. It is allowed, but discouraged, to updates those local variables in statements S<sub>1</sub>, S<sub>2</sub>, .... Each method has a predefined local variable *result*, initialized to None, that is returned by the method. Harmony does not support a `return` statement that *breaks out* of the code before executing the last statement.

## B.8 `del`

The statement `del` x removes variable x from the state. x can be either a local or a shared variable. For example, the statement `del` x.age removes the .age field from dictionary x. Harmony automatically removes top-level local variables that are no longer in use from the state in order to attempt to reduce the number of states that are evaluated during model checking. Because Harmony lists are dictionaries, deleting from lists is different from Python: x = [.a, .b]; del x[0] results in x having value {1 : .b} rather than [.b] (which is {0 :b}).

## B.9 `for` `in` [...where]

The statement for x in y: S<sub>1</sub>; S<sub>2</sub>; ... iterates over y and executes for each element the statements S<sub>1</sub>, S<sub>2</sub>, .... y must be a set or a dictionary. y is evaluated only once at the beginning of the evaluation of this statement. In case of a set, the result is sorted (using Harmony’s global order on all values). In case of a dictionary, the statement iterates over the values of the dictionary in the order of the keys. This makes iterating over lists intuitive and identical to Python. For each element, the statements S<sub>1</sub>, S<sub>2</sub>, ...are executed with local variable y having the value of the element. x can be a pattern such as (a) or (a,(b, c)). If the pattern cannot be matched, Harmony detects and error. It is allowed, but discouraged, to assign different values to x within statements S<sub>1</sub>, S<sub>2</sub>, .... If y is a dictionary, Harmony also supports the form `for` k : v `in` y: S<sub>1</sub>; S<sub>2</sub>; .... This works similar, except that k is bound to the key and v is bound to the value.

The statement also supports nesting and filtering. Nesting is of the form `for` x<sub>1</sub> `in` y<sub>1</sub> `for` x<sub>2</sub> `in` y<sub>2</sub> : S<sub>1</sub>; S<sub>2</sub>; ..., which is equivalent to the statement `for` x<sub>1</sub> `in` y<sub>1</sub> : `for` x<sub>2</sub> in y<sub>2</sub>: S<sub>1</sub>; S<sub>2</sub>; .... Filtering is of the form `for` x `in` y `where` z : S<sub>1</sub>; S<sub>2</sub>; .... For example, `for` x `in` {1 .. 10} `where` (x%2) == 0 : S<sub>1</sub>; S<sub>2</sub>; ... only evaluates statements S<sub>1</sub>, S<sub>2</sub>, ...`for` even x, that is, 2, 4, 6, 8, and 10. Harmony does not support `break` or `continue` statements.

## B.10 `from import`

The statement `from` x `import` a, b, ... imports module x and makes its constants a, b, ... also constants in the current module. If a module is imported more than once, its code is only included the first time. The constants will typically be the names of methods (program counter constants) within the module.
You can import all constants from a module m (including program counter constants) using the statement `from` m `import` *. This, however, excludes constants whose names start with the character : those are considered private to the module.

## B.11 `go`

The statement `go` c e starts a thread with context c that has executed a `stop` expression. The `stop` expression returns value e. The same context can be started multiple times, allowing threads to fork.

## B.12 `if [elif ...]* [else]`

Harmony supports if statements. In its most basic form,`if` c: S<sub>1</sub>; S<sub>2</sub>; ...evaluatescand executes statements S<sub>1</sub>, S<sub>2</sub>, ... if and only if boolean expression c evaluated to true. Harmony checks that c is either False or True — if neither is the case, Harmony reports an error. The statement if c: S<sub>1</sub>, S<sub>2</sub>, ... else: T<sub>1</sub>; T<sub>2</sub>; ... is similar, but executes statements T<sub>1</sub>, T<sub>2</sub>, ... if and only if c evaluated to false. You can think of `elif` c: as shorthand for `else:` `if` c:.

## B.13 `import`

The statement `import` m<sub>1</sub>, m<sub>2</sub>, ... imports modules m<sub>1</sub>, m<sub>2</sub>, ... in that order. If a module is imported more than once, its code is only included the first time. The constants (including method constants) and shared variables declared in that module can subsequently be referenced by prepending `m.`. For example, method f() in imported module m is invoked by calling `m.f()`. If you would prefer to invoke it simply as f(), then you have to import using the statement `from` m `import` f.

## B.14 `invariant`

The statement invariant c declares that boolean expression c is an invariant. c is only allowed to read shared variables and is evaluated atomically after every state change. If it ever evaluates to False, Harmony reports an error. Harmony also reports an error if the expression evaluates to a value other than False or True.

## B.15 `let`

You can introduce new local variables in a method using the `let` expression. The statement `let` a = b: S<sub>1</sub>; S<sub>2</sub>, ... evaluates b, assigns the result to local variable a, and evaluates statements S<sub>1</sub>, S<sub>2</sub>, .... `let` supports pattern matching, so you can write `let` x,(y, z) = b: S<sub>1</sub>; S<sub>2</sub>, .... This will only work if b is a tuple with two elements, the second of which also being a tuple with two elements — if not, Harmony will report an error. The variables may be updates in statements S<sub>1</sub>, S<sub>2</sub>, .... `let` statements may be nested, such as `let` a<sub>1</sub> =  b<sub>1</sub> `let` a<sub>2</sub> = b<sub>2</sub>: S<sub>1</sub>; S<sub>2</sub>; .... Doing so can improve readability by reducing indentation compared to writing them as separate statements. Compare the following two examples:

```
let a = y:
let b = z:
```
```
let a = y
let b = z:
    ...
```
## B.16 `pass`

The `pass` statement does nothing.

## B.17 `possibly`

The statement `possibly` b<sub>1</sub>, b<sub>2</sub>, ... atomically evaluates all predicates b<sub>i</sub>. At completion, Harmony reports which of the predicates never held.

## B.18 `select` `in`

The statement `select` x `in` y: S<sub>1</sub>; S<sub>2</sub>; ... requires that `y` evaluates to a set value. The statement does the following three things atomically:

- it waits until y is non-empty;

- it selects one element of y non-deterministically (using a `choose` expression);

- it executes statements S<sub>1</sub>, S<sub>2</sub>, ... with the selected element assigned to local variable x.

x may be a pattern, like in `let`, `for` and `def` statements. Harmony reports an error if `y` evaluates to a value that is not a set. If waiting is an unused local variable, then `select` x `in` y: S<sub>1</sub>; S<sub>2</sub>; ...is equivalent to

```
let waiting = True:
    while waiting:
        atomic:
            if y != {}:
                let x = choose(y):
                    S1
                    S2
                    ...
                    waiting = False
```

The statement is particularly useful in programming network protocols when having to wait for one or more messages and executing a set of actions atomically after the desired messages have arrived.

## B.19 `sequential`

In Harmony, shared variable Load and Store operations are atomic and havesequential consistency. However, Harmony does check for data races. A data race occurs when two or more threads simultaneously access the same shared variable, with at least one of the accesses being a Store operation outside of an atomic block. If so, Harmony will report an error. This error can be suppressed by declaring the shared variable as sequential. In particular, the statement `sequential` x, y, ... specifies that the algorithm assumes that the given variables have sequential consistency.

> Note that few modern processors support sequentially consistent memory by default, as doing so would lead to high overhead.

## B.20 `spawn`

The statement `spawn` m a starts a new thread that executes method m with argument a. m must be a program counter constant, and a is typically a tuple containing zero or more parameters to be passed to the method. The default thread-local state of the thread, called self, is the empty dictionary by default. It can be specified by adding a parameter: `spawn` m a, e specifies that e should be the initial value of the thread-local state. Harmony normally checks that all threads eventually terminate. If a thread may never terminate, you should spawn it with `spawn` `eternal` m a to suppress those checks.

## B.21 `trap`

The statementtrapm aspecifies that the current thread should execute method m with argument a and some future unspecified time. It models a timer interrupt or any kind of asynchronous event to be handled by the thread. Such interrupts can be disabled by setting the interrupt level of the thread to True using the `setintlevel` operator.

## B.22 `while`

The statement while c: S<sub>1</sub>; S<sub>2</sub>; ...executes statements S<sub>1</sub>, S<sub>2</sub>, ...repeatedly as long as c evaluates to True. Harmony does not support break or continue statements.