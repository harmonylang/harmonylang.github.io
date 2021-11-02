
# Chain Replication 


```python
const NREPLICAS = 4     # number of replicas
const NOPS = 5          # number of operations
network = {}            # the network is a set of messages
final = None            # this is used to check correctness

def send(m):
    atomically network |= { m }

def receive(predecessor, index):
    result = { payload for (id, payload) in network where (id == predecessor)
                        and ((payload == .crash) or (payload[0] == index)) }

def replica(self, immortal):
    var history, predecessors = [ ], { 0 .. self – 1 }
    while choose({ immortal, True }) and (len(history) < NOPS):
        if predecessors == {}:  # I’m the head
            send(self, (len(history), self))
            history += [self,]
        else:                   # I’m not the head (yet)
            atomically when exists payload in receive(max(predecessors), len(history)):
                if payload == .crash:
                    predecessors –= { max(predecessors) }
                else:
                    send(self, payload)
                    history += [payload[1],]
    if len(history) == NOPS:    # successful completion
        atomically:
            assert (final == None) or (final == history)
            possibly 0 in history, 1 in history, (NREPLICAS – 1) in history
            final = history
    else:       # replica crashed
        send(self, .crash)
let survivor = choose({ 0 .. NREPLICAS – 1 }):
    for i in { 0 .. NREPLICAS – 1 }:
        spawn replica(i, i == survivor)
```

As you have probably experienced, computers can crash. If you are
running a web service, you may not be able to afford a long outage. If
you are running software that flies a plane, then an outage for any
length of time could lead to a disaster. To deal with service outages
caused by computers crashing, you may want to *replicate* the service
onto multiple computers. As long as one of the computers survives, the
service remains available.

Besides availability, it is usually important that the replicated
service acts as if it were a single one. This requires that the replicas
of the service coordinate their actions. The *Replicated State Machine
Approach* is a general approach to do just this. First,
you model your service as a deterministic state machine. The replicas
each run a copy of the state machine, started in the same state. As long
as the replicas handle the same inputs in the same order, determinism
guarantees that they produce the same outputs in the same order. The
trick then is to ensure that all replicas handle the same requests in
the same order and to do so in a way that continues to work even if some
strict subset of replicas crash.

*Chain Replication* is such a replication protocol. In Chain
Replication, the replicas are organized in a linear chain. Each replica
monitors its direct predecessor in the chain. If a replica has no
predecessors, we call it the *head*. The head may change over time, as a
head may crash and replaced by another, but at any point in time there
is only one head (and only one *tail*, possibly the same replica). We
model the state machine as a *history*: a sequence of operations. Only
the head is allowed to introduce new updates. When it does so, it
advertises the new update along with its position in the history. When
the direct successor receives the next update it is expecting, it
appends the update to its history and likewise advertises the new
update. When the update is applied to the history of the tail replica
(the replica that has no live successors), then the update is considered
final.

So, when a replica fails, its successors should find out about it. In
practice, one server can detect the failure of another server by pinging
it. If a server does not receive a response to its ping within some
maximum amount of time, then the server considers its peer crashed. Note
that this, in general, is not a safe thing to do---the network or the
peer may be temporarily slow but the peer is not necessarily crashed
when the timer expires. Nonetheless, we will assume here that failure
detection does not make mistakes and that eventually every failure is
eventually detected. This is called the *Fail-Stop* failure
model, which is distinct from the often more realistic *Crash*
failure model where processes can crash but accurate detection is not
available. We will consider that failure model in the upcoming chapters.

shows an implemenation of chain replication. The code starts `NREPLICAS`
`replica` threads numbered 0 through $\mathtt{NREPLICAS} - 1$, with
initially 0 being the head and $\mathtt{NREPLICAS} - 1$ being the tail.
At least one of the replicas must be immortal---the code selects one of
them although none of the replicas is required to fail during execution.
Of course, a replica does not know whether it is immortal or not in
practice---it should just assume so. The immortality of one of the
replicas is only used for modeling the system.

Each replica maintains its history and a set of its predecessors. It
then loops until either it fails or it has applied all `NOPS` operations
to its history.
$\mathbf{choose}(\{ \mathit{immortal}, \textbf{True} \})$ can only
evaluate to **False** in case $\textit{immortal}$ is false; otherwise it
will always evaluate to **True**. What it does within the loop depends
on whether it is the head (has no alive predecessors) or not. Because
failure detection is accurate, at most one replica can think it is the
head at any time (and, if so, it is in fact the head). Moreover, when it
has detected all its predecessors having failed, eventually some replica
thinks it is the head.

Messages have the format $(\mathit{source}, \mathit{payload})$, where
*source* is the identifier of the replica that generated the message and
*payload* has information about the state of the replica. The payload
can take one of two forms. The first is `.crash`, indicating that the
source of the message has crashed. The code models a replica crashing by
that replica broadcasting a `.crash` message on the network. The other
form of payload is a tuple $(\mathit{index}, \mathit{operation})$, which
means that the source placed the given operation at the given index in
its history.

If a replica thinks it is the head, it adds an operation to its history.
In practice this would be some operation that the head would have
received from a client. Clients send their operations to the head, which
adds them to its history in the order received. We are not modeling
clients of the service. Instead, in the model, the head adds its
identifier *self* to the history until the history has `NOPS` operations
on it or until the head crashes, whichever comes first. The head also
broadcasts each update, which are intended for its successor. Because of
failures, it may be that at different times a replica has different
successors, hence the broadcast.

Otherwise, the replica does not believe it is the head and awaits a
message from its direct predecessor. If the payload is `.crash`, then
the replica removes this predecessor from its set of predecessors. For
example, if there are initially three replicas numbered 0, 1, and 2, and
replica 1 crashes, then replica 2 removes 1 from its set of
predecessors, making replica 0 its direct (and only) predecessor. If,
instead, the payload is a tuple, then it must be the case that it
contains the next operation to add to its history. The replica adds the
operation to its history and broadcasts the update, again intended for
its successor.

When the replica successfully adds all `NOPS` updates to its history
without crashing, the code makes sure that any other such replica ends
in the same state. Variable *final* is used to check the different
histories against one another.
