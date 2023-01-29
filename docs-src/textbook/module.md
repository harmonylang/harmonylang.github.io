
# Modules 

Harmony modules provide convenient access to various data structures,
algorithms, and synchronization paradigms.
They are all implemented in the Harmony language itself (so
you can look at their code) although some methods have also been implemented
directly into the underlying model checker for more efficient model checking.

Currently there are the following modules:

| Module | Description |
| ------ | ------- |
| `action` | support for action-based specifications |
| `alloc` | dynamic memory allocation |
| `bag` | multi-sets |
| `fork` | fork/join interface to threads |
| `hoare` | Hoare module interface |
| `list` | common operations on lists |
| `set` | common operations on sets |
| `synch` | synchronization |

## The `action` module

The `action` module supports *action-based* specification.
Such a specification consists of a explicit global state and rules
for how to make state transitions. Chapter 28 provides an example.
The module has only one method:

| Method | Description |
| ------ | ------- |
| `explore(x)` | explore the state space |

Here `x` is a set of lambdas, each of which can return a set of
*closures*, each representing a possible action (state change).
The union of the results of the lambdas should generate all possible
actions.  A closure represents a method and its arguments that
updates the state accordingly.

## The `alloc` module

The `alloc` module supports thread-safe (but not interrupt-safe) dynamic
allocation of shared memory locations. There are just two methods:

| Method | Description |
| ------ | ------- |
| `malloc`(*v*) | return a pointer to a memory location initialized to *v* |
| `free`(*p*) |   free an allocated memory location *p* |

The usage is similar to `malloc` and `free` in C. `malloc`() is
specified to return `None` when running out of memory, although this is
an impossible outcome in the current implementation of the module.

## The `bag` module 

The `bag` module has various useful methods that operate on bags or
multisets:

| Method | Description |
| ------ | ------- |
| `empty`() |                returns an empty bag |
| `fromSet(s)` |             create a bag from set *s* |
| `fromList(t)` |            convert list *t* into a bag |
| `multiplicity(b, e)` |     count how many times *e* occurs in bag *b* |
| `bchoose(b)` |             like `choose(s)`, but applied to a bag |
| `add`(*b*, *e*) |          add one copy of *e* to bag *b* |
| `remove`(*b*, *e*) |       remove one copy of *e* from bag *b* |
| `combinations`(*b*, *k*) | return set of all *subbags* of size *k* |

## The `fork` module

The `fork` module implements the fork/join interface to threads.

| Method | Description |
| ------ | ------- |
`fork(closure)` |           spawn `closure` and return a thread handle |
`join(handle)` |            wait for the thread to finish and return its result |

For example, the following code doubles each element of `data` in parallel
and then sums the result when done.

```python
from fork import *
from list import *

data = { 1, 2, 4 }

def main():
    let double = lambda x: 2*x end
    let map = { fork(?double(k)) for k in data }:
        print sum(join(t) for t in map)

spawn main()
```

## The `hoare` module 

The `hoare` module implements support for Hoare-style monitors and
condition variables.

| Method | Description |
| ------ | ------- |
| `Monitor()` |    return a monitor mutex |
| `enter(m)` |     enter a monitor. *m* points to a monitor mutex |
| `exit(m)` |      exit a monitor |
| `Condition()` |  return a condition variable |
| `wait(c, m)` |   wait on condition variable pointed to by *c* in monitor pointed to by *m* |
| `signal(c, m)` | signal a condition variable |

## The `list` module 

The `list` module has various useful methods that operate on lists or
tuples:

| Method | Description |
| ------ | ------- |
| `subseq(t, b, f)` | return a *slice* of list *t* starting at index *b* and ending just before $f$ |
| `append(t, e)` |    append *e* to list *t* |
| `head(t)` |         return the first element of list *t* |
| `tail(t)` |         return all but the first element of list *t* |
| `index(t, e)` |     return the index of element *e* in list *t* |
| `startswith(t, s)`| returns whether *s* is a prefix of *t* |
| `reversed(t)` |     reverse a list |
| `sorted(t)` |       sorted set or list |
| `set(t)` |          convert a list into a set |
| `list(t)` |         convert set into a list |
| `values(t)` |       convert values of a dict into a list sorted by key |
| `items(t)` |        convert dict into (key, value) list sorted by key |
| `enumerate(t)` |    like Python enumerate |
| `sum(t)` |          returns the sum of all elements in *t* |
| `qsort(t)` |        sort list *t* using quicksort |
| `foldl(t, f, z)` |  left fold with *f* a binary method and *z* the initial value |
| `foldr(t, f, z)` |  right fold with *f* a binary method and *z* the initial value |
| `reduce(f, t, z)` | same as `foldl(t, f, z)` |

## The `set` module 

The `set` module implements the following methods:

| Method | Description |
| ------ | ------- |
| `issubseteq`(*s*, *t*) |      returns whether *s* is a subset of *t* |
| `issubsetstrict`(*s*, *t*) |  returns whether *s* is a strict subset of *t* |
| `issubset`(*s*, *t*) |        same as `issubseteq(s, t)` |
| `issuperseteq`(*s*, *t*) |    returns whether *s* is a superset of *t* |
| `issupersetstrict`(*s*, *t*)| returns whether *s* is a strict superset of *t* |
| `issuperset`(*s*, *t*) |      same as `issuperseteq(s, t)` |
| `add`(*s*, *e*) |             returns $s \cup \{ e \}$ |
| `remove`(*s*, *e*) |          returns $s \backslash \{ e \}$ |
| `subsets(s)` |                returns the set of subsets of *s* |
| `union(s)` |                  returns the union of the elements of *s* |
| `cartesian(d)` |              *d* is a list of sets.  Returns the Cartesian product. |
| `combinations(s, k)` |        returns set of all subsets of size *k* |
| `reduce(f, t, z}>)` |         same as Python's `functools reduce()`|

For Python programmers: note that *s* $<=$ *t* does not check if *s* is
a subset of *t* when *s* and *t* are sets, as "$<=$" implements a total
order on all Harmony values including sets (and the subset relation is
not a total order).

## The `synch` module

The `synch` module provides the following methods:

| Method | Description |
| ------ | ------- |
| `atomic_load`(*p*) | atomically evaluate !*p* |
| `atomic_store`(*p*, *v*) | atomically assign !*p* = *v* |
| `tas`(*lk*) |                test-and-set on !*lk* |
| `cas`(*ptr*, *old*, *new*) | compare-and-swap on !*ptr* |
| `BinSema`(*v*) |             return a binary semaphore initialized to *v* |
| `Lock`() |                   return a binary semaphore initialized to `False` |
| `acquire`(*bs*) |            acquire binary semaphore !*bs* |
| `release`(*bs*) |            release binary semaphore !*bs* |
| `Condition`() |              return a condition variable |
| `wait`(*c*, *lk*) |          wait on condition variable !*c* and lock *lk* |
| `notify`(*c*) |              notify a thread waiting on condition variable !*c* |
| `notifyAll`(*c*) |           notify all threads waiting on condition variable !*c* |
| `Semaphore`(*cnt*) |         return a counting semaphore initialized to *cnt* |
| `P`(*sema*) |                procure !*sema* |
| `V`(*sema*) |                vacate !*sema* |
| `Queue`() |                  return a synchronized queue object |
| `get`(*q*) |                 return next element of *q*, blocking if empty |
| `put`(*q*, *item*) |         add *item* to *a* |
