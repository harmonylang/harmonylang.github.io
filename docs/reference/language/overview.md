# Overview

This reference manual describes the syntax and “core semantics” of the language. It is terse, but attempts to be exact and complete.  For an informal introduction to the language, see the [tutorial](../../guides/introduction.md).

 1. [Value Types](./value-types.md)
    - [1.1. Boolean](./value-types.md#11-boolean)
    - [1.2. Integer](./value-types.md#12-integer)
    - [1.3. Atom](./value-types.md#13-atom)
    - [1.4. Set](./value-types.md#14-set)
    - [1.5. Dictionary](./value-types.md#15-dictionary)
    - [1.6. List or Tuple](./value-types.md#16-list-or-tuple)
    - [1.7. String](./value-types.md#17-string)
    - [1.8. Bag or Multiset](./value-types.md#18-bag-or-multiset)
    - [1.9. Program Counter](./value-types.md#19-program-counter)
    - [1.10. Address](./value-types.md#110-address)
    - [1.11. Context](./value-types.md#111-context)
 2. [Statements](./statements.md)
 3. [Machine Instructions](./machine-instructions.md)
 4. [Contexts & Threads](./contexts-threads.md)
 5. [The Harmony VM](./harmony-vm.md)

# Harmony Language Details

The Harmony language borrows heavily from Python. However, there are some important differences that we will describe below.

## Harmony is not object-oriented

Python is object-oriented, but Harmony is not. This can lead to some unexpected differences. For example, consider the following code:

```
x = y = [ 1, 2 ]
x[0] = 3
assert y[0] == 1
```

In Python, lists are objects. Thus *x* and *y* point to the same list, and the assertion would fail if executed by Python. In Harmony, lists are values. So when *x* is updated in Line 2, it does not affect the value of *y*. The assertion succeeds. Harmony supports references to values, allowing programs to implement shared objects.

Because Harmony does not have objects, it also does not have object methods. However, Harmony methods and lambdas are program counter constants. These constants can be added to dictionaries. For example, in [PetersonMethod.hny](https://harmony.cs.cornell.edu/ide/?template=PetersonMethod) you can add the P enter and P exit methods to the

```
{ .turn: 0, .flags: [ False, False ], .enter: P_enter, .exit: P_exit }
```

That would allow you to simulate object methods.

There are at least two reasons why Harmony is not object-oriented. First, object-orientation often adds layers of indirection that would make it harder to model check and also to interpret the results. Consider, for example, a lock. In Python, a lock is an object. A lock variable would contain a reference to a lock object. In Harmony, a lock variable contains the value of the lock itself. Thus, the following statement means something quite different in Python and Harmony:

```
x = y = Lock();
```

In Python, this creates two variables *x* and *y* referring to the same lock. In Harmony, the two variables will be two different locks. If you want two variables referring to the same lock in Harmony, you would write:

```
x = y = malloc(Lock());
```

The second reason for Harmony not being object-oriented is that many concurrency solutions in the literature are expressed in C or some other low-level language that does not support objectorientation, but instead use malloc and free.

## Constants, Global and Local Variables


Each (non-reserved) identifier in a Harmony program refers to either a constant, a global variable, or a local variable. Constants are declared using const statements. Those constants are computed at compile-time.

Local variables all declared. They can be declared in def statements (i.e., arguments), let statements, and in for loops. Also, each method has an implicitly declared *result* variable. Local variables are tightly scoped and cannot be shared between threads. While in theory one method can be declared within another, they cannot share variables either. All other variables are global and must be initialized before any threads are spawned.

While arguments to a method and variables in for loops can be modified, we discourage it for improved code readability.

## Operator Precedence

In Harmony, there is no syntactic difference between applying an argument to a function or an index to a dictionary. Both use the syntax *a b c ...*. We call this *application*, and application is left-associative. So *a b c* is interpreted as (*a b*) *c*: *b* is applied to *a*, and then *c* is applied to the result. For readability, it may help to write *a*(*b*) for function application and *a*[*b*] for indexing. In case *b* is an atom, you can also write *a.b* for indexing.

There are three classes of precedence. Application has the highest precedence. So !*a b* is interpreted as !(*a b*) and *a b* + *c d* is interpreted as (*a b*) + (*c d*). Unary operators have the next highest precedence, and the remaining operators have the lowest precedence. So -2 + 3 evaluates to 1, not -5.

Associative operators (+, ∗, |, &, ˆ, **and**, **or**) are interpreted as general *n*-ary operators, and you are allowed to write *a* + *b* + *c*. However, *a* - *b* - *c* is illegal, as is any combination of operators with an arity larger than one, such as *a* + *b < c*. In such cases you have to add parentheses or brackets to indicate what the intended evaluation order is, such as (*a* + *b*) *< c*.

In almost all expressions, subexpressions are evaluated left to right. So *a*[*b*] + *c* first evaluates *a*, then *b* (and then applies *b* to *a*), and then *c*. The one exception is the expression *a* **if** *c* **else** *b*, where *c* is evaluated first. In that expression, only *a* or *b* is evaluated depending on the value of *c*. In the expression *a* **and** *b* **and** *...*, evaluation is left to right but stops once one of the subexpressions evaluates to **False**. Similarly for **or**, where evaluation stops once one of the subexpressions evaluates to True. A sequence of comparison operations, such as *a < b < c*, is evaluated left to right but stops as soon as one of the comparisons fails.

As an aside: the expression *a* **not in** *b* is equivalent to **not** (*a* **in** *b*). Harmony generalizes this construct for any pair of a unary (except '-') and a binary operator. In particular, *a* **not and** *b* is the same as **not** (*a* **and** *b*). For those familiar with logic gates, **not and** is the equivalent of NAND. Similarly, **not** =*>* is non-implication.

## Tuples, Lists, and Pattern Matching

Harmony's tuples and, equivalently, lists, are just special cases of dictionaries. They can be bracketed either by '(' and ')' or by '[' and ']', but the brackets are often optional. Importantly, with a singleton list, the one element must be followed by a comma. So the statement *x* = 1,; assigns a singleton tuple (or list) to *x*.

Because tuples and lists are dictionaries, the del statement is different from Python. For example, if *x* = [.a, .b, .c], then del *x*[1] results in *x* = { 0:.a, 2:.c }, *not x* = [.a, .c]. Harmony also does not support special slicing syntax like Python. To modify lists, use the subseq method in the [list module](./value-types.md#16-list-or-tuple).

Harmony allows pattern matching against nested tuples in various language constructs. The following are the same in Python and Harmony:

- *x,* = 1,: assigns 1 to *x*;

- *x*, *y* = 1, (2, 3): assigns 1 to *x* and (2, 3) to *y*;

- *x*, (*y*, *z*) = 1, (2, 3): assigns 1 to *x*, 2 to *y*, and 3 to *z*;

- *x*, (*y*, *z*) = 1, 2; generates an runtime error because 2 cannot be matched with (*y*, *z*);

- *x*[0], *x*[1] = *x*[1], *x*[0]; swaps the first two elements of list *x*.

As in Python, pattern matching can also be used in for statements. For example:

```
for key, value in [ (1, 2), (3, 4) ]: ...
```

Harmony (but not Python) also allows pattern matching in defining and invoking methods. For example, you can write:

```
def f[a, (b, c)]: ...
```

and then call f[1, (2, 3)]. Note that the more familiar: def g(*a*) defines a method *g* with a single argument *a*. Invoking g(1, 2) would assign the tuple (1, 2) to *a*. This is not consistent with Python syntax. For single argument methods, you may want to declare as follows: def g(*a,*). Calling g(1,) assigns 1 to *a*, while calling g(1, 2) would result in a runtime error as (1, 2) cannot be matched with (*a*,).

Pattern matching can also be used in const and let statements.

```
from stack import Stack, push, pop

teststack = Stack()
push(?teststack, 1)
push(?teststack, 2)
v = pop(?teststack)
assert v == 2
push(?teststack, 3)
v = pop(?teststack)
assert v == 3
v = pop(?teststack)
assert v == 1
```
*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stacktest)*

### For Loops and Comprehensions

While Harmony does not support general iterators such as Python does, Harmony allows iterating over sets and dictionaries (and thus lists and tuples). The details are a little different from Python:

- When iterating over a set, the set is always traversed [in order](./value-types.md);

- In case of a dictionary, the iteration is over the *values* of the dictionary, but in the order of the keys. In the case of lists, this works much the same as in Python, but in the case of general dictionaries, Python iterates over the keys rather than the values;

- If you want to iterate over the keys of a dictionary *d*, use for *k* inkeys *d*;

- The [list module](./value-types.md#16-list-or-tuple) provides methods values(), items(), enumerate(), and reversed() for other types of iteration supported by Python.

Harmony supports nesting and filtering in for loops. For example:

```
for i in { 1..10 } for j in { 1..10 } where i < j: ...
```

Harmony also supports set, list, and dictionary comprehensions. Comprehensions are similar to Python, except that filtering uses the keyword where instead of if.

## Dynamic Allocation

Harmony supports various options for dynamic allocation. By way of example, consider a stack. The code below presents a test program for a stack. We present four different stack implementations to illustrate options for dynamic allocation:

```
from stack import Stack, push, pop

teststack = Stack()
push(?teststack, 1)
push(?teststack, 2)
v = pop(?teststack)
assert v == 2
push(?teststack, 3)
v = pop(?teststack)
assert v == 3
v = pop(?teststack)
assert v == 1
```
*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stacktest)*

### Dynamically Updated List

The code below uses a single list to represent the stack. It is updated to perform push and pop operations.

```
def Stack():
   result = [ ]

def push(st, v):
   (!st)[len(!st)] = v

def pop(st):
   let n = len(!st) – 1:
      result = (!st)[n]
      del (!st)[n]
```
*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stack1)*

### Static List

The code below also uses a list but, instead of updating the list, it replaces the list with a new one for each operation.

```
import list

def Stack():
    result = []

def push(st, v):
    !st += [v,]

def pop(st):
    let n = len(!st) - 1:
        result = (!st)[n]
        !st = list.subseq(!st, 0, n)
```

*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stack2)*

### Recursive Tuple

The code below represents a stack as a recursively nested tuple (*v,f*), where *v* is the element on top of the stack and *r* is a stack that is the remainder.

```
def Stack():
    result = ()

def push(st, v):
    (!st) = (v, !st)

def pop(st):
    let (top, rest) = !st:
        result = top
        !st = rest
```
*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stack3)*

### Linked List

The code below implements a stack as a linked list with nodes allocated using the alloc module.

```
from alloc import malloc, free

def Stack():
    result = None

def push(st, v):
    !st = malloc({ .value: v, .rest: !st })

def pop(st):
    let node = !st:
        result = node->value
        !st = node->rest
        free(node)
```

*Try out the stack implementation above [in the IDE!](https://harmony.cs.cornell.edu/ide/?template=stack4)*

While the last option is the most versatile (it allows cyclic data structures), Harmony does not support garbage collection for memory allocated this way and so allocated memory that is no longer in use must be explicitly released using free.

## Comments

Harmony supports the same commenting conventions as Python. In addition, Harmony supports nested multi-line comments of the form `(*` comment `*)`.