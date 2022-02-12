
# Replicated Atomic Read/Write Register 

```python title="register.hny"
--8<-- "register.hny"
```

<figcaption>Figure 28.1 (<a href=https://harmony.cs.cornell.edu/code/register.hny>code/register.hny</a>): 
An atomic read/write register </figcaption>

A *register* is an object that you can read or write. In a distributed
system, examples include a shared file system (each file is a register)
or a key/value store (each key corresponds to a register). A simple
shared register implementation would have its value maintained by a
server, and clients can read or write the shared register by exchanging
messages with the server. We call two operations such that one does not
finish before the other starts *concurrent*. Since messages are
delivered one at a time to the server, concurrent operations on the
shared register appear atomic. In particular, we have the following
three desirable properties:

1.  All write operations are ordered;

2.  A read operation returns either the last value written or the value
    of a concurrent write operation.

3.  If read operation $r_1$ finishes before read operation $r_2$ starts,
    then $r_2$ cannot return a value that is older than the value
    returned by $r_1$.


![](figures/abdtest.png)

```python title="abdtest.hny"
--8<-- "abdtest.hny"
```

<figcaption>Figure 28.2 (<a href=https://harmony.cs.cornell.edu/code/abdtest.hny>code/abdtest.hny</a>): 
Behavioral test for atomic read/write registers and the output for the
case that `NREADERS` = `NWRITERS` = 1 </figcaption>

It is instructive to look at the test program and its output in
Figure 28.2. This is for the case when there is only a single reader
thread (identified as "1") and a single writer thread (identified as
"$-1$"), but already there are many cases to consider. Each thread
prints information just before and just after doing their single
operation. The output shows all possible interleavings in the form of a
DFA. Note that if the read operation starts after the write operation
has completed, then the read operaion must return the new value.
However, if the two operations interleave in some way, then the read
operation can return either the old or the new value.

Unfortunately, a server is a *single point of failure*: if it fails, all
its clients suffer. We would therefore like to find a solution that can
survive the crash of a server. While we could use Chain Replication to
replicate the register, in this chapter we will use a solution that does
not assume that crashes can be accurately detected.

We will again replicate the register object: maintain multiple copies,
but we will not use the replicated state machine approach. One could,
for example, imagine that clients write to all copies and read from any
single one. While this solves the single-point-of-failure problem, we
lose all the nice properties above. For one, it is not guaranteed that
all servers receive and process all write operations in the same order.

We present a protocol preserving these properties that is based on the
work by Hagit Attiya, Amotz Bar-Noy, and Danny Dolev. In order
to tolerate `F` failures, it uses `N` = 2`F` + 1 servers. In other
words, the register survives as long as a strict majority of its copies
survive. All write operation will be ordered by a unique *logical
timestamp* (see also [Chapter 13](testing.md)). Each server maintains not only the
value of the object, but also the timestamp of its corresponding write
operation.

Each read and write operation consists of two *phases*. In a phase, a
client broadcasts a request to all servers and waits for responses from
a majority (`N` -- `F` or equivalently `F` + 1 servers). Note that
because we are assuming that no more than `F` servers can fail, doing so
is safe, in that a client cannot indefinitely block as long as that
assumption holds.

In the first phase, a client asks each server for its current timestamp
and value. After receiving `N` -- `F` responses, the client determines
the response with the highest timestamp. In case of a write operation,
the client then computes a new unique timestamp that is strictly higher
than the highest it has seen. To make this work, timestamps are actually
lexicographically ordered tuples consisting of an integer and the unique
identifier of the client that writes the value. So, if $(t, c)$ is the
highest timestamp observed by client $c'$, and $c'$ needs to create a
new timestamp, it can select $(t + 1, c')$. After all
$(t + 1, c') > (t, u)$ and no other client will create the same
timestamp.

Suppose client $c'$ is trying to write a value *v*. In phase 2, client
$c'$ broadcasts a request containing timestamp $(t+1, c')$ and *v*. Each
server that receives the request compares $(t+1, c')$ against its
current timestamp. If $(t+1, c')$ is larger than its current timestamp,
it adopts the new timestamp and its corresponding value *v*. In either
case, the server responds to the client. Upon $c'$ receiving a response
from `N` -- `F` servers, the write operation completes. In case of a
read operation, client $c'$ simply *writes back* the highest timestamp
it saw in the first phase along with its corresponding value.


```python title="abd.hny"
--8<-- "abd.hny"
```

<figcaption>Figure 28.3 (<a href=https://harmony.cs.cornell.edu/code/abd.hny>code/abd.hny</a>): 
An implementation of a replicated atomic read/write register
</figcaption>

Figure 28.3 contains the code for a server, as well as the code for read
and write operations. For efficiency of model checking, the servers are
anonymous---otherwise we would have to consider every permutation of
states of those servers. Because the servers are anonymous, they may end
up sending the same exact message, but clients are waiting for a
particular number of messages. Because of this, we will model the
network as a bag of messages.

A server initializes its timestamp *t* to $(0, \mathtt{None})$ and its
value to `None`. Each server also keeps track of all the requests its
already received so it doesn't handle the same request twice. The rest
of the code is fairly straightforward.

Read and write operations are both invoked with a unique identifier
*uid*. Both start by broadcasting a .`read` request to all servers and
then waiting for a response from `N` -- `F` servers. The `receive`()
function uses the `bag`.*combinations* method to find all combinations
of subsets of responses of size `N` -- `F`. The second phase of each
operation is similar.

Figure 28.2 can be used to test this protocol, although you will
notice that the model checker cannot deal with cases involving more than
three client threads. Three is just enough to check the third property
listed above (using one writer and two readers). Doing so illustrates
the importance of the second phase of the `read` operation. You can
comment out Lines 34, 36, and 37 in Figure 28.3 and to elide the second
phase and see what goes wrong.

One may wonder how failures can occur in this model. They are not
explicitly modeled, but Harmony tries every possible execution. This
includes executions in which the clients terminate before `F` of the
servers start executing. To the clients, this is indistinguishable from
executions in which those servers have failed.
