# Working with Actions

So far we have mostly modeled concurrent activities using threads.
Another way of modeling is by enumerating all the possible state
transitions from any given state. For example, this is how things
are commonly specified in TLA+. As in TLA+, we call such state transitions 
*actions*. In this chapter we will revisit modeling chain replication,
but this time using actions.

```python title="chainaction.hny"
--8<-- "chainaction.hny"
```

<figcaption>Figure 28.1 (<a href=https://harmony.cs.cornell.edu/code/chainaction.hny>code/chainaction.hny</a>): 
Chain Replication specification using actions</figcaption>

Figure 28.1 contains the new specification.  The state of the replicas
and the clients are stored in the variables `replicas` and `clients`
respectively. Each type of action is captured using a lambda and a method.
The method updates the state, while the lambda enumerates the possible
actions of this type.

For example, consider the *crash* action.  All replicas, except
the replica that is immortal and the replicas that have already crashed,
can crash.  There is a lambda `crash` that generates a set of all
possible crashes.  Each element in the set is a *closure* consisting
of a method call and an argument.  For example, `?do_crash(1)` is the
action representing replica~1 failing.  If we look at the `do_crash(p)`
method, all it does is set the `crashed` field of the replica.
The specification does this for every type of action:

 - `sendOperation`: a client broadcasts an operation to all replicas.
 - `gotOperation`: the head replica adds the operation to its history.
 - `sendHist`: a replica sends its history to its successor.
 - `gotHist`: a replica accepts a history it has received.
 - `deliver`: the tail delivers (prints) an operation. 
 - `crash`: a replica crashes.
 - `detect`: a replica detects the crash of a peer.

The Harmony `action` module explores all possible behaviors of
such a specification.  It has a single method `explore` that takes
a set of lambdas, each of which returning a set of possible actions.

So, which of the two types of specification do you prefer?
One metric is readability, but that is subjective and depends on
what you have experience with. Another object is the size of the
state space, and in general control over the state space that is
being explored. Threads have hidden state such as their stacks,
program counters, and local variables, adding to the state space
in sometimes unexpected ways.

With an action-based specification all state is explicit, and all
state changes are explicit.  This can be advantageous.
On the other hand, the thread-based specification is easier to turn
into an actual running implementation.