
# Leader Election 

Leader election is the problem of electing a unique leader in a network
of processors. Typically this is challenging because the processors have
only limited information. In the version that we present, each processor
has a unique identifier. The processors are organized in a ring, but
each processor only knows its own identifier and the identifier of its
successor on the ring. Having already looked into the problem of how to
make the network reliable, we assume here that each processor can
reliably send messages to its successor.

The protocol that we present elects as leader the processor with the
highest identifier and works in two phases: in the first phase,
each processor sends its identifier to its successor. When a processor
receives an identifier that is larger than its own identifier, it
forwards that identifier to its successor as well. If a processor
receives its own identifier, it discovers that it is the leader. That
processor then starts the second phase by sending a message around the
ring notifying the other processors of the leader's identifier.

```python title="leader.hny"
const NIDS = 5 # number of identifiers
network = {} # the network is a set of messages
leader = 0 # used for checking correctness

def send(m):
    atomically network |= { m }

def receive(self):
    result = { (id, found) for (dst, id, found) in network where dst ==
self }

def processor(self, succ):
    send(succ, self, False)
    var working = True
    while working:
        atomically when exists (id, found) in receive(self):
            if id == self:
                assert self == leader
                send(succ, id, True)
            elif id > self:
                assert self != leader
                send(succ, id, found)
            if found:
                working = False
var ids, nprocs, procs = { 1 .. NIDS }, choose({ 1 .. NIDS }), [ ]
for i in { 0 .. nprocs - 1 }:
    let next = choose(ids):
        ids -= { next }
        procs += [ next, ]
        if next > leader:
            leader = next
for i in { 0 .. nprocs - 1 }:
    spawn processor(procs[i], procs[(i + 1) % nprocs])
```

<figcaption>Figure 25.1 (
<a href=https://harmony.cs.cornell.edu/code/leader.hny>code/leader.hny</a>): 
A leader election protocol on a ring </figcaption>

Figure 25.1 describes the protocol and its test cases in Harmony. In
Harmony, processors can be modeled by threads and there are a variety of
ways in which one can model a network using shared variables. Here, we
model the network as a set of messages. The `send` method atomically
adds a message to this set. Messages are tuples with three fields:
(*dst*, *id*, *found*). *dst* is the identifier of the destination
processor; *id* is the identifier that is being forwarded; and *found*
is a boolean indicating the second phase of the protocol. The
`receive`(*self*) method looks for all messages destined for the
processor with identifier *self*.

To test the protocol, the code first chooses the number of processors
and generates an identifier for each processor, chosen
non-deterministically from a set of `NIDS` identifiers. It also keeps
track in the variable *leader* of what the highest identifier is, so it
can later be checked.

Method `processor`(*self*, *succ*) is the code for a processor with
identifier *self* and successor *succ*. It starts simply by sending its
own identifier to its successor. The processor then loops until it
discovers the identifier of the leader in the second phase of the
protocol. A processor waits for a message using the Harmony
**atomically** **when** **exists** statement. This statement takes the
form

**atomically** **when** **exists** *v* **in** *s*: *statement block*

where *s* is a set and *v* is variable that is bound to an element of
*s*. The properties of the statement are as follows:

-   it waits until *s* is non-empty;

-   it is executed atomically;

-   *v* is selected non-deterministically, like in the **choose**
    operator.

If a processor receives its own identifier, it knows its the leader. The
Harmony code checks this using an assertion. In real code the processor
could not do this as it does not know the identifier of the leader, but
assertions are only there to check correctness. The processor then sends
a message to its successor that the leader has been found. If the
processor receives an identifier higher than its own, the processor
knows that it cannot be the leader. In that case, it simply forwards the
message. A processor stops when it receives a message that indicates
that the leader has been identified.

Note that there is a lot of non-determinism in the specification,
leading to a lot of executions that must be checked. First, every
possible permutation of identifiers for the processors is tried. When
there are multiple messages to receive by a processor, every possible
order is tried (including receiving the same message multiple times).
Fortunately, the `atomically when exists` statement is executed
atomically, otherwise the body of the statement could lead to additional
thread interleavings. Because in practice the different processors do
not share memory, it is not necessary to check those interleavings.

## Exercises 

**25.1** Check if the code finds a unique leader if identifiers are not unique.

**25.2** Messages are added atomically to the network. Is this necessary? What
happens if you remove the **atomically** keyword? Explain what happens.

