
# Paxos 


```python
import bag
const F = 1
const NACCEPTORS = (2 * F) + 1
const NLEADERS = F + 1
const NBALLOTS = 2
network = bag.empty()
proposals = [ choose({0, 1}) for i in {0..NLEADERS–1} ]

def send(m):
    atomically network = bag.add(network, m)

def receive(ballot, phase):
    let msgs = { e:c for (b,p,t,e):c in network
                        where (b,p,t) == (ballot, phase, "B") }:
        result = bag.combinations(msgs, NACCEPTORS – F)
print proposals
for i in {0..NLEADERS – 1}:
    spawn leader(i + 1, proposals[i])
for i in {1..NACCEPTORS}:
    spawn eternal acceptor()
```

<figcaption>Figure 32.1 (
<a href=https://harmony.cs.cornell.edu/code/paxos.hny>code/paxos.hny</a>): 
A version of the Paxos protocol, Part 1 </figcaption>


```python
def leader(self, proposal):
    var ballot, estimate = self, proposal
    send(ballot, 1, "A", None)
    while ballot  < = NBALLOTS:
        atomically when exists quorum in receive(ballot, 1):
            let accepted = { e for e:_ in quorum where e != None }:
                if accepted != {}:
                    _, estimate = max(accepted)
            send(ballot, 2, "A", estimate)
        atomically when exists quorum in receive(ballot, 2):
            if bag.multiplicity(quorum, (ballot, estimate)) ==
(NACCEPTORS – F):
                assert estimate in proposals # validity
                print estimate
            ballot += NLEADERS
            if ballot  < = NBALLOTS:
                send(ballot, 1, "A", None)

def acceptor():
    var ballot, last_accepted, received = 0, None, {}
    while True:
        atomically when exists b,p,e in { (b,p,e) for b,p,t,e:_ in
network
                    where ((b,p) not in received) and (t == "A") }:
            received |= { (b, p) }
            if b  > = ballot:
                ballot = b
                if p == 2:
                    last_accepted = (ballot, e)
            send(b, p, "B", last_accepted)
```

<figcaption>Figure 32.2 (
<a href=https://harmony.cs.cornell.edu/code/paxos.hny>code/paxos.hny</a>): 
A version of the Paxos protocol, Part 2 </figcaption>

Paxos is the most well-known family of consensus protocols for
environments in which few or no assumptions are made about timing. In
this chapter, we present a basic version of a Paxos protocol, one that
is *single-decree* (only tries to make a single decision). It uses two
kinds of processors: *leaders* and *acceptors*. In order to tolerate `F`
crash failures, you need at least `F` + 1 leaders and $2\texttt{F} + 1$
acceptors, but leaders and acceptors can be colocated, so in total only
$2\texttt{F} + 1$ independently failing processors are needed. Here we
provide only a rudimentary introduction to Paxos; for more detailed
information refer to.

As in the consensus protocol of [Chapter 31](consensus.md), Paxos uses rounds of
messaging. The communication pattern, however, is different. Similar to
the atomic read/write register protocol in [Chapter 30](abd.md), Paxos uses two
kinds of rounds: "Phase 1" and "Phase 2" rounds. Rounds are identified
by a so-called *ballot number* combined with the phase number. Different
leaders are in charge of different ballot numbers. Leaders broadcast
"Type A" messages to the acceptors, which respond point-to-point with
"Type B" messages.

Figure 32.1 and Figure 32.2 contain the code for this Paxos
protocol. Paxos is perhaps best understood starting with the second
phase. At the end of the first phase, the leader broadcasts a `2.A`
message (Phase 2, Type A) to the acceptors containing the ballot number
and a proposal and then waits for `N` -- `F` matching `2.B` responses
from the acceptors. If each response contains the ballot number and the
proposal, then the proposal is deemed decided. But one or more of the
responses can contain a higher ballot number, in which case the leader
has to try again with an even higher ballot number. This is where the
first phase comes in.

It is not possible that an acceptor responds with a smaller ballot
number. This is because acceptors maintain two state variables. One is
*ballot*, the highest ballot number they have seen. Second is a variable
called *last_accepted* that, if not `None`, contains the last proposal
the acceptor has *accepted* and the corresponding ballot number. The
acceptor also contains a set *received* that contains (ballot, phase)
tuples identifiying all rounds that the ballot has already participated
in. An acceptor waits for a message for a round that is not in
*received*. If its ballot number is higher than what it has seen before,
the acceptor moves into that ballot. If the phase is 2, then the
acceptor accepts the proposal and remembers when it did so by saving the
(ballot, proposal) tuple in *last_accepted*. In all cases, the acceptor
responds with the current values of *ballot* and *last_accepted*.

In its first phase, a leader of a ballot must come up with a proposal
that cannot conflict with a proposal of an earlier ballot that may
already have been decided. To this end, the leader broadcasts a `2.A`
message to the acceptors and awaits `N` -- `F` of their *last_accepted*
values. If all those acceptors responded with `None`, then the leader is
free to choose its own proposal. Otherwise the leader updates its
proposal with the one corresponding to the highest ballot number. The
leader then moves on to the second round.

To run and check the Paxos code, do the following (leveraging the
consensus specification of Figure 31.1):

    $ harmony -o consensus.hfa -cN=2 code/consensus.hny
    $ harmony -B consensus.hfa code/paxos.hny

You should get a warning that our implementation of Paxos does not
generate all possible behaviors. This is because we only run the
protocol for a finite number of ballots, and therefore at least one of
the ballots will be successful. With an unlimited number of ballots,
Paxos may never decide unless you make some liveness assumptions.

## Exercises 


Perhaps the trickiest detail of the algorithm is that, in Line 8 of
Figure 32.2, the leader selects the proposal with the highest ballot
number it receives. Replace the `max` operator in that statement with
**choose** and see if it finds a problem. First try with
$\texttt{NBALLOTS} = 2$ and then with $\texttt{NBALLOTS} = 3$. (Warning,
the latter may take a long time.) If it finds a problem, analyze the
output and see what went wrong.
 discusses a buggy version of Paxos. In this version, the
responses to the second phase are matched not by ballot number but by
the value of the proposal. Implement this version and, using Harmony,
find the problem this causes.

