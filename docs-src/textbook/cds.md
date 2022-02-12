
# Concurrent Data Structures 

<figure>
<table style="width: 100%;">
    <tr>
        <th>Sequential</th>
        <th>Concurrent</th>
    </tr>
<tr>
<td>

```python title="queuespec.hny"
--8<-- "queuespec.hny"
```

</td>
<td>

```python title="queue.hny"
--8<-- "queue.hny"
```

</td>
</tr>
</table>
<figcaption>Figure 11.1: A sequential and a concurrent specification of a queue</figcaption>
</figure>

```python title="queuedemo.hny"
--8<-- "queuedemo.hny"
```

<figcaption>Figure 11.2 (<a href=https://harmony.cs.cornell.edu/code/queuedemo.hny>code/queuedemo.hny</a>): 
Using a concurrent queue </figcaption>

The most common use for locks is in building concurrent data structures.
By way of example, we will first demonstrate how to build a concurrent
queue. The `queue` module can be used as follows:

-   *x* = `Queue`(): initialize a new queue *x*;

-   `put`(?*x*, *v*): add *v* to the tail of *x*;

-   *r* = `get`(?*x*): returns *r* = `None` if *x* is empty or *r* = *v*
    if *v* was at the head of *x*.

Figure 11.1(a) shows a sequential specification for such a queue in
Harmony (exploiting some methods from the `list` module described in ).
It is a credible queue implementation,
but it cannot be used with threads concurrently accessing this queue.
Figure 11.1(b) shows the corresponding concurrent specification. 
It cannot be used as an implementation for a queue, as processors generally
do not have atomic operations on lists, but it will work well as a
specification. See Figure 11.2 for a simple demonstration program that uses a
concurrent queue.

```python title="queueconc.hny"
--8<-- "queueconc.hny"
```

<figcaption>Figure 11.3 (<a href=https://harmony.cs.cornell.edu/code/queueconc.hny>code/queueconc.hny</a>): 
An implementation of a concurrent queue data structure
</figcaption>


```python title="queueMS.hny"
--8<-- "queueMS.hny"
```

<figcaption>Figure 11.4 (<a href=https://harmony.cs.cornell.edu/code/queueMS.hny>code/queueMS.hny</a>): 
A queue with separate locks for enqueuing and dequeuing items
</figcaption>

We will first implement the queue as a linked list. The implementation
in Figure 11.3 uses the `alloc` module for dynamic allocation of
nodes in the list using `malloc`() and `free`(). `malloc`(*v*) returns a
new memory location initialized to *v*, which should be released with
`free`() when it is no longer in use. The queue maintains a `head`
pointer to the first element in the list and a `tail` pointer to the
last element in the list. The `head` pointer is `None` if and only if
the queue is empty. (`None` is a special address value that is not the
address of any memory location.)

`Queue`() returns the initial value for a queue object consisting of a
`None` head and tail pointer and a lock. The `put`(*q*, *v*) and
`get`(*q*) methods both take a pointer *q* to the queue object because
both may modify the queue. Before they access the value of the head or
tail of the queue they first obtain the lock. When they are done, they
release the lock.

An important thing to note in Figure 11.2 is Lines 7 and 8. It
would be incorrect to replace these by:
```
assert queue.get(q) in { None, 1, 2 }
```
The reason is that `queue.get()` changes the state by acquiring a lock,
but the expressions in **assert** statements (or **invariant**
statements) are not allowed to change the state.

Figure 11.4 shows another concurrent queue implementation.
It is well-known, but what is not often realized is that it requires
sequentially consistent memory, which is not said explicitly in the
paper. As a result, the algorithm must be coded very carefully to work
correctly with modern programming languages and computer hardware. The
implementation uses separate locks for the head and the tail, allowing a
`put` and a `get` operation to proceed concurrently. To avoid contention
between the head and the tail, the queue uses a dummy node at the head
of the linked list. Except initially, the dummy node is the last node
that was dequeued. Note that neither the `head` nor `tail` pointer are
ever `None`. The problem is when the queue is empty and there are
concurrent `get` and `put` operations. They obtain separate locks and
then concurrently access the *next* field in the dummy node---a data
race with undefined semantics in most environments.

## Exercises 


**11.1** Add a method `contains`(*q*, *v*) to Figure 11.1(b) that checks to see if *v* is
in queue *q*.

**11.2** Add a method `length`(*q*) to Figure 11.3 that returns the length
of the given queue. The complexity of the method should be $O(1)$, which
is to say that you should maintain the length of the queue as a field
member and update it in `put` and `get`.

**11.3** Write a method `check`(*q*) that checks the integrity of the queue in
Figure 11.3. In particular, it should check the following
integrity properties:

-   If the list is empty, *q*->`tail` should be `None`.
    Otherwise, the last element in the linked list starting from
    *q*->`head` should equal *q*->`head`.
    Moreover, *q*->`tail`->*next* should be
    `None`;

-   The length field that you added in Exercise 11.3 should equal the length of the
    list.

**11.4** Method `check`(*q*) should not obtain a lock; instead add the following
line just before releasing the lock in `put` and `get`:
```
assert check()
```
$\mathtt{remove}(q, v)$ to Figure 11.3 that removes all
occurrences of *v*, if any, from queue *q*.

**11.5** The test program in Figure 11.2 is not a thorough test program.
Design and implement a test program for Figure 11.2. Make sure you
*test* the test program by trying it out against some buggy queue
implementations. (You will learn more about testing concurrent programs
in [Chapter 13](testing.md).)

