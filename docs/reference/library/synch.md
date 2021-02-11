# The `synch` module

The `synch` module provides the following methods:


| Method | Description |
| ------ | ------- |
| `tas(lk)` | test-and-set on `!lk` |
| `BinSem(v)` | return a binary semaphore initialized to `v` |
| `Lock()` | return a binary semaphore initialized to `False` |
| `acquire(bs)` | acquire binary semaphore `!bs` |
| `release(bs)` | release binary semaphore `!bs` |
| `Condition()` | return a condition variable |
| `wait(c, lk)` | wait on condition variable `!c` and lock `lk` |
| `notify(c)` | notify a thread waiting on condition variable `!c` |
| `notifyAll(c)` | notify all threads waiting on condition variable `!c` |
| `Semaphore(cnt)` | return a counting semaphore initialized to `cnt` |
| `P(sema)` | procure `!sema` |
| `V(sema)` | vacate `!sema` |
| `Queue()` | return a synchronized queue object |
| `get(q)` | return next element of `q`, blocking if empty |
| `put(q, item)` | add `item` to `a` |

<br />