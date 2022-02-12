
# Fine-Grained Locking 

A queue has the nice property that usually only the head or the tail is
accessed. However, in many data structures it is necessary to "walk" the
data structure, an operation that can take significant time. In such a
case, a single lock (known as a "big lock") for the entire data
structure might restrict concurrency to an unacceptable level. To reduce
the granularity of locking, each node in the data structure must be
endowed with its own lock instead.


```python title="setobj.hny"
--8<-- "setobj.hny"
```

<figcaption>Figure 12.1 (<a href=https://harmony.cs.cornell.edu/code/code/setobj.hny>code/setobj.hny</a>): 
Specification of a concurrent set object </figcaption>

```python title="setobjtest.hny"
--8<-- "setobjtest.hny"
```

<figcaption>Figure 12.2 (<a href=https://harmony.cs.cornell.edu/code/setobjtest.hny>code/intsettest.hny</a>): 
Test code for set objects</figcaption>

Figure 12.1 gives the specification of a concurrent set object.
`SetObject()` returns a pointer to a variable that contains an empty
set, rather than returning an empty set *value*. As such, it is more
like an object in an object-oriented language than like a value in its
own right. Values can be added to the set object using `insert()` or
deleted using `remove()`. Method `contains()` checks if a particular
value is in the list. Figure 12.2 contains a simple (although not
very thorough) test program to demonstrate the use of set objects.


```python title="linkedlist.hny"
--8<-- "linkedlist.hny"
```

<figcaption>Figure 12.3 (<a href=https://harmony.cs.cornell.edu/code/linkedlist.hny>code/linkedlist.hny</a>): 
Implementation of a set of values using a linked list with
fine-grained locking </figcaption>

Figure 12.3 implements a concurrent set object using an ordered linked list without duplicates.
The list has two dummy ``book-end'' nodes with values $(-1, None)$ and
$(1, None)$.  A value $v$ is stored as $(0, v)$ &mdash; note that for
any value $v$, $(-1, None) < (0, v) < (1, None)$. An invariant of the algorithm is that at any point
in time list is "valid", starting with a $(-1, None)$ node and ending
with an $(1, None)$ node.

Each node has a lock, a value, and *next*, a pointer to the next node
(which is `None` for the $(1, None)$ node to mark the end of the list). The `_find`(*lst*, *v*) helper
method first finds and locks two consecutive nodes *before* and *after*
such that *before*->*data*.*value* $<$ *(0, v*) $<=$
*after*->*data*.*value*. It does so by performing something
called *hand-over-hand locking*. It first locks the first node, which is
the $(-1, None)$ node. Then, iteratively, it obtains a lock on the next node
and release the lock on the last one, and so on, similar to climbing a
rope hand-over-hand. Using `_find`, the `insert`, `remove`, and
`contains` methods are fairly straightforward to implement.

## Exercises 


**12.1** Add methods to the data structure in Figure 12.3 that report the
size of the list, the minimum value in the list, the maximum value in
the list, and the sum of the values in the list. (All these should
ignore the two end nodes.)

**12.2** Create a thread-safe sorted binary tree. Implement a module `bintree`
with methods $\mathtt{BinTree}()$ to create a new binary tree,
$\mathtt{insert}(t, v)$ that inserts *v* into tree *t*, and
$\mathtt{contains}(t, v)$ that checks if *v* is in tree *t*. Use a
single lock per binary tree.

**12.3** Create a binary tree that uses, instead of a single lock per tree, a
lock for each node in the tree.

