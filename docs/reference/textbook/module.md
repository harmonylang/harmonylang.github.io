
# Modules 

## The `alloc` module

The `alloc` module supports thread-safe (but not interrupt-safe) dynamic
allocation of shared memory locations. There are just two methods:

| Method | Description |
| ------ | ------- |
| `malloc(v)` | return a pointer to a memory location initialized to $v$ |
| `free(p)` |   free an allocated memory location $p$ |

The usage is similar to `malloc` and `free` in C. `malloc`() is
specified to return `None` when running out of memory, although this is
an impossible outcome in the current implementation of the module.

## The `bag` module 

The `bag` module has various useful methods that operate on bags or
multisets:

| Method | Description |
| ------ | ------- |
| `empty()` |                returns an empty bag |
| `fromSet(s)` |             create a bag from set $s$ |
| `fromList(t)` |            convert list $t$ into a bag |
| `count(b, e)` |            count how many times $e$ occurs in bag $b$ |
| `bchoose(b)` |             like `choose(s)`, but applied to a bag |
| `add`($b$, $e$) |          add one copy of $e$ to bag $b$ |
| `remove`($b$, $e$) |       remove one copy of $e$ from bag $b$ |
| `combinations`($b$, $k$) | return set of all *subbags* of size $k$ |

## The `hoare` module 

The `hoare` module implements support for Hoare-style monitors and
condition variables.

| Method | Description |
| ------ | ------- |
| `Monitor()` |    return a monitor mutex |
| `enter(m)` |     enter a monitor. $m$ points to a monitor mutex |
| `exit(m)` |      exit a monitor |
| `Condition()` |  return a condition variable |
| `wait(c, m)` |   wait on condition variable pointed to by $c$ in monitor pointed to by $m$ |
| `signal(c, m)` | signal a condition variable |

## The `list` module 

The `list` module has various useful methods that operate on lists or
tuples:

| Method | Description |
| ------ | ------- |
| `subseq(t, b, f)` | return a *slice* of list $t$ starting at index $b$ and ending just before $f$ |
| `append(t, e)` |    append $e$ to list $t$ |
| `head(t)` |         return the first element of list $t$ |
| `tail(t)` |         return all but the first element of list $t$ |
| `reversed(t)` |     reverse a list |
| `sorted(t)` |       sorted set or list |
| `set(t)` |          convert values of a dict or list into a set |
| `list(t)` |         convert set into a list |
| `values(t)` |       convert values of a dict into a list sorted by key |
| `items(t)` |        convert dict into (key, value) list sorted by key |
| `enumerate(t)` |    like Python enumerate |
| `sum(t)` |          return the sum of all elements in $t$ |
| `qsort(t)` |        sort list $t$ using quicksort |

## The `set` module 

The `set` module implements the following methods:

| Method | Description |
| ------ | ------- |
| `issubset(s, t)` |         returns whether $s$ is a subset of $t$ |
| `issuperset(s, t)` |       returns whether $s$ is a superset of $t$ |
| `add`($s$, $e$) |          returns $s \cup \{ e \}$ |
| `remove`($s$, $e$) |       returns $s \backslash \{ e \}$ |
| `combinations`($b$, $k$) | returns set of all subsets of size $k$ |

For Python programmers: note that $s <= t$ does not check if $s$ is a
subset of $t$ when $s$ and $t$ are sets, as "$<=$" implements a total
order on all Harmony values including sets (and the subset relation is
not a total order).

## The `synch` module

The `synch` module provides the following methods:

| Method | Description |
| ------ | ------- |
| `tas`(*lk*) |                test-and-set on `!`*lk* |
| `cas`(*ptr*, *old*, *new*) | compare-and-swap on `!`*ptr* |
| `BinSem`($v$) |              return a binary semaphore initialized to $v$ |
| `Lock`() |                   return a binary semaphore initialized to **False** |
| `acquire`(*bs*) |            acquire binary semaphore `!`*bs* |
| `release`(*bs*) |            release binary semaphore `!`*bs* |
| `Condition`() |              return a condition variable |
| `wait`($c$, *lk*) |          wait on condition variable `!`$c$ and lock *lk* |
| `notify`($c$) |              notify a thread waiting on condition variable `!`$c$ |
| `notifyAll`($c$) |           notify all threads waiting on condition variable `!`$c$ |
| `Semaphore`(*cnt*) |         return a counting semaphore initialized to *cnt* |
| `P`(*sema*) |                procure `!`*sema* |
| `V`(*sema*) |                vacate `!`*sema* |
| `Queue`() |                  return a synchronized queue object |
| `get`($q$) |                 return next element of $q$, blocking if empty |
| `put`($q$, *item*) |         add *item* to $a$ |
