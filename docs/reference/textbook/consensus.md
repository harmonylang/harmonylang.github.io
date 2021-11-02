
# Distributed Consensus 


```python
import bag
const F = 1
const N = (3 * F) + 1
const NROUNDS = 3
network = bag.empty()
let n_zeroes = choose({ 0 .. N / 2 }):
    proposals = [ 0 if i  < = n_zeroes else 1 for i in { 1 .. N } ]
decisions = {}

def broadcast(msg):
    atomically network = bag.add(network, msg)

def receive(round, k):
    let msgs = { e:c for (r,e):c in network where r == round }:
        result = bag.combinations(msgs, k)

def processor(prop):
    var proposal = prop
    broadcast(0, proposal)
    for round in {0..NROUNDS–1}:
        atomically when exists quorum in receive(round, N – F):
            let count = [ bag.count(quorum, i) for i in { 0..1 } ]:
                assert count[0] != count[1]
                proposal = 0 if count[0] > count[1] else 1
                if count[proposal] == (N – F):
                    assert proposal in proposals           # validity
                    possibly proposal == 0, proposal == 1  # can decide
either value
                    decisions |= { proposal }
                    assert len(decisions)  < = 1             # agreement
                broadcast(round + 1, proposal)
for i in {0..N–1}:
    spawn processor(proposals[i])
```

Distributed consensus is the problem of having a collection of
processors agree on a single value over a network. For example, in state
machine replication, the state machines have to agree on which operation
to apply next. Without failures, this can be solved using leader
election: first elect a leader, then have that leader decide a value.
But consensus often has to be done in adverse circumstances, for example
in the face of processor failures. In this chapter, we will present a
simple consensus algorithm that can tolerate fewer than $1/3^{rd}$ of
processors failing by crashing.

More precisely, constant `F` contains the maximum number of failures,
and we will assume there are $\texttt{N} = 3\texttt{F} + 1$ processors.
Each processor *proposes* a value, which we assume here to be from the
set { 0, 1 }. By the usual definition of consensus, we want the
following two properties:

1.  *Validity*: a processor can only decide a value that has been
    proposed;

2.  *Agreement*: if two processors decide, then they decide the same
    value.

The consensus problem is surprisingly tricky to solve in the face of
processor failures and without making assumptions about how long it
takes to send and receive a message.

presents our algorithm. Besides the network variable, it uses a shared
list of proposals and a shared set of decisions. To reduce the state
space to explore, not all permutations of zeroes and ones are explored.
With 5 processors ($\mathtt{F} = 2)$, say, we only explore the cases
where no processors propose 1, where exactly one processors proposes 1,
and where 2 processors proposes 1. In this particular algorithm, all
messages are broadcast to all processors, so they do not require a
destination address. The invariants we want to maintain on those
variables is that $\textit{decisions} \subseteq \textit{proposals}$ and
$|\textit{decisions}| \leq 1$. Since the initial value of *decisions* is
$\emptyset$, the invariants clearly hold initially.

The $\mathtt{N}$ processors go through a sequence of *rounds* in which
they wait for $\texttt{N} - \texttt{F}$ messages, update their state
based on the messages, and broadcast messages containing their new
state. The reason that a processor waits for $\texttt{N} - \texttt{F}$
rather than `N` messages is because of failures: up to $\texttt{F}$
processors may never send a message and so it would be unwise to wait
for all $\texttt{N}$. You might be tempted to use a timer and time out
on waiting for a particular processor. But how would you initialize that
timer? While we will assume that the network is reliable, there is no
guarantee that messages arrive within a particular time. We call a set
of $\texttt{N} - \texttt{F}$ processors a *quorum*. A quorum must
suffice for the algorithm to make progress.

The state of a processor consists of its current round number and
proposal. Therefore, messages contain a round number and a proposal. To
start things, each processor first broadcasts its initial round number
(0) and proposal. The number of rounds that are necessary to achieve
consensus is not bounded. But Harmony can only check finite models, so
there is a constant `NROUNDS` that limits the number of rounds. It may
be that no decisions are made, but that does not violate either Validity
or Agreement. We only check that *if* decisions are made, they satisfy
Validity and Agreement.

In Line 22, a processor waits for $\texttt{N} - \texttt{F}$ messages
using the Harmony **select** statement. Since Harmony has to check all
possible executions of the protocol, the `receive`(*round*, $k$) method
returns all *subbags* of messages for the given round that have size
$k = \texttt{N} - \texttt{F}$. The method uses a dictionary
comprehension to filter out all messages for the given *round* and then
uses the `bag.combinations` method to find all combinations of size $k$.
The **select** statement waits until there is at least one such
combination and then chooses an element, which is bound to the *quorum*
variable. The body of the **select** statement is then executed
atomically. This is usually how distributed algorithms are modeled,
because they can only interact through the network. There is no need to
interleave the different processes other than when messages are
delivered. By executing the body atomically, a lot of unnecessary
interleavings are avoided and this reduces the state space that must be
explored by the model checker significantly.

The body of the **select** statement contains the core of the algorithm.
Note that $\texttt{N} - \texttt{F} = 2\texttt{F} + 1$, so that the
number of messages is guaranteed to be odd. Also, because there are only
0 and 1 values, there must exist a majority of zeroes or ones. Variable
*count*\[0\] stores the number of zeroes and `count`\[1\] stores the
number of ones received in the round. The rules of the algorithm are
simple:

-   update *proposal* to be the majority value;

-   if the quorum is unanimous, decide the value.

After that, proceed with the next round.

The `possibly` statement checks if there exist executions where 0 is
decided and if there exist executions where 1 is decided. Doing so is
useful because the assertions would certainly not fail if no decision is
ever made. Also, it is nice to know that both 0 and 1 can be decided.


```python
import bag
const F = 2
const N = (3 * F) + 1
const NROUNDS = 3
network = bag.empty()
let n_zeroes = choose({ 0 .. N / 2 }):
    proposals = [ 0 if i  < = n_zeroes else 1 for i in { 1 .. N } ]
decisions = {}

def broadcast(msg):
    atomically network = bag.add(network, msg)

def receive(round):
    let msgs = { e:c for (r,e):c in network where r == round }:
        result = {} if bag.size(msgs) < N else { msgs }

def processor(proposal):
    broadcast(0, proposal)
    for round in {0..NROUNDS–1}:
        atomically when exists msgs in receive(round):
            let choices = bag.combinations(msgs, N – F)
            let quorum = choose(choices)
            let count = [ bag.count(quorum, i) for i in { 0..1 } ]:
                assert count[0] != count[1]
                proposal = 0 if count[0] > count[1] else 1
                if count[proposal] == (N – F):
                    assert proposal in proposals           # validity
                    possibly proposal == 0, proposal == 1  # can decide
either value
                    decisions |= { proposal }
                    assert len(decisions)  < = 1             # agreement
                broadcast(round + 1, proposal)
for i in {0..N–1}:
    spawn processor(proposals[i])
```

While one can run this code within little time for $\mathtt{F} = 2$, for
$\mathtt{F} = 3$ the state space to explore is already quite large. One
way to reduce the state space to explore is the following realization:
each processor only considers messages for the round that it is in. If a
message is for an old round, the processor will ignore it; if a message
is for a future round, the processor will buffer it. So one can simplify
the model and have each processor wait for *all* `N` messages in a round
instead of $\mathtt{N} - \mathtt{F}$. It would still have to choose to
consider just $\mathtt{N} - \mathtt{F}$ out of those `N` messages, but
executions in which some processors are left behind in all rounds are no
longer considered. It still includes executions where some subset of
$\mathtt{N} - \mathtt{F}$ processors only choose each other messages and
essentially ignore the messages of the remaining `F` processors, so the
resulting model is just as good.

shows the code for this model. Running this with $\mathtt{F} = 3$ does
not take very long and this approach is a good blueprint for testing
other round-based protocols (of which there are many).

## Exercises 


The algorithm as given works in the face of crash failures. A more
challenging class to tolerate are *arbitrary failures* in which up to
`F` processors may send arbitrary messages, including conflicting
messages to different peers (equivocation). The algorithm can tolerate
those failures if you use $\mathtt{N} = 5\mathtt{F} - 1$ processors
instead of $\mathtt{N} = 3\mathtt{F} - 1$. Check that.

In 1983, Michael Ben-Or presented a randomized algorithm that can
tolerate crash failures with just $\mathtt{N} = 2\mathtt{F} - 1$
processors. Implement this algorithm.

