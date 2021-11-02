
# Needham-Schroeder Authentication Protocol 


```python
network = {}
dest = choose({ None, .bob, .corey })

def send(m):
    atomically network |= { m }

def alice():
    if dest != None:
        send({ .dst: dest,
            .contents: { .type: 1, .nonce: .nonceA, .initiator: .alice } })
        atomically when exists m in network when (m.dst == .alice)
                    and (m.contents.type == 2) and (m.contents.nonce == .nonceA):
            send({ .dst: dest, .contents: { .type: 3, .nonce: m.contents.nonce2 } })

def bob():
    atomically when exists m in network when (m.dst == .bob)
                    and (m.contents.type == 1) and (m.contents.initiator == .alice):
        send({ .dst: .alice,
            .contents: { .type: 2, .nonce: m.contents.nonce, .nonce2: .nonceB } })
    atomically when exists m in network when (m.dst == .bob)
                    and (m.contents.type == 3) and (m.contents.nonce == .nonceB):
        assert dest == .bob

def corey():
    var received, nonces, msgs = {}, { .nonceC }, {}
    while True:
        atomically when exists m in network – received when m.dst == .corey:
            received |= { m }
            nonces |= { m.contents.nonce }
            if m.contents.type == 2:
                nonces |= { m.contents.nonce2 }
            for dst in { .alice, .bob } for n in nonces:
                msgs |= {{ .dst: dst, .contents: { .type: 1, .nonce: n, .initiator: ini }}
                                    for ini in { .alice, .bob }}
                msgs |= {{ .dst: dst, .contents: { .type: 2, .nonce: n, .nonce2: n2 }}
                                    for n2 in nonces }
                msgs |= {{ .dst: dst, .contents: { .type: 3, .nonce: n }}}
            send(choose(msgs – network))
spawn alice(); spawn bob()
spawn eternal corey()
```

The Needham-Schroeder protocol is a security protocol in which
two parties authenticate one another by exchanging large and recently
created random numbers called *nonces* that nobody else should be able
to read. The nonces should only be used once for an instantiation of the
protocol between honest participants (i.e., participants that follow the
protocol). The version we describe here uses *public key
cryptography*: with public key cryptography it is possible to
create a message for a particular destination that only that destination
can read. We denote with $\langle m \rangle_p$ a message $m$ encrypted
for $p$ so that only $p$ can decrypt the message and see that it
contains $m$.

Suppose Alice wants to communicate with Bob. The three critical steps in
the Needham-Schroeder protocol are as follows:

1.  Alice creates a new nonce $N_A$ and sends
    $\langle 1, A, N_A \rangle_\mathtt{Bob}$ to Bob;

2.  Upon receipt, Bob creates a new nonce $N_B$ and sends
    $\langle 2, N_A, N_B \rangle_\mathtt{Alice}$ to Alice;

3.  Alice sends $\langle 3, N_B \rangle_\mathtt{Bob}$ to Bob.

When Bob receives $\langle 1, A, N_A \rangle_\mathtt{Bob}$, Bob does not
know for sure that the message came from Alice, and even if it came from
Alice, it does not know if Alice sent the message recently or if it was
replayed by some adversary. When Alice receives
$\langle 2, N_A, N_B \rangle_\mathtt{Alice}$, Alice *does* know that, if
Bob is honest, (1) Bob and only Bob could have created this message, and
(2) Bob must have done so recently (since Alice created $N_A$). When Bob
receives $\langle 3, N_B \rangle_\mathtt{Bob}$, Bob decides that it is
Alice that is trying to communicate at this time. Since Bob created
$N_B$ recently and sent it encrypted to Alice, Bob does not have to
worry that the type 3 message was an old message that was replayed by
some adversary. Also, if Alice is honest, it seems only Alice can have
seen the message containing $N_B$.

Thus, the intended security properties of this protocol are symmetric.
Assuming Alice and Bob are both honest:

-   if Alice finishes the protocol with Bob and received $B_N$ from Bob,
    then nobody but Alice and Bob can learn $N_B$.

-   if Bob finishes the protocol with Alice and received $A_N$ from
    Alice, then nobody but Bob and Alice can learn $N_A$.

After the protocol, Alice can include $N_A$ in messages to Bob and Bob
can include $N_B$ in messages to Alice to authenticate the sources of
those messages to one another.

shows the protocol implemented in Harmony. A message
$\langle m \rangle_p$ is encoded in Harmony as a dictionary
$\{ \mathtt{.dst}: p, \mathtt{.contents}: m \}$. The code for Alice and
Bob simply follows the steps listed above.

Unfortunately, the protocol turns out to be incorrect, but it took 17
years before somebody noticed. Model checking can be used to
find the bug. To demonstate the bug, we need to model the
environment. In particular, we introduce a third party, which we will
call Corey. We want to make sure that Corey cannot impersonate Alice or
Bob. However, it is possible that Alice tries to set up an authenticated
connection to Corey using the Needham-Schroeder protocol. That in itself
should not be a problem if the protocol were correct.

The code in has Alice either not do anything, or has Alice try to set up
a connection to either Bob or Corey. Bob only accepts connections with
Alice. Corey, when receiving a message that it can decrypt, will try to
find an attack by sending every possible message to every possible
destination. In particular, it keeps track of every nonce that it has
seen and will try to construct messages with them to send to Alice and
Bob. If Bob finishes the protocol, it checks to see if Alice actually
tried to connect to Bob. If not, the assertion fails and an attack is
found.

Running the code in quickly finds a viable attack. The attack goes like
this:

1.  Alice creates a new nonce $N_A$ and sends
    $\langle 1, A, N_A \rangle_\mathtt{Corey}$ to Corey;

2.  Upon receipt, Corey sends $\langle 1, A, N_A \rangle_\mathtt{Bob}$
    to Bob;

3.  Upon receipt, Bob, believing it is engaging in the protocol with
    Alice, creates a new nonce $N_B$ and sends
    $\langle 2, N_A, N_B \rangle_\mathtt{Alice}$ to Alice;

4.  Alice thinks the message came from Corey (because it contains $N_A$,
    which Alice created for Corey and sent to Corey) and sends
    $\langle 3, N_B \rangle_\mathtt{Corey}$ to Corey.

5.  Corey learns $N_B$ and sends $\langle 3, N_B \rangle_\mathtt{Bob}$
    to Bob.

6.  Bob receiving $\langle 3, N_B \rangle_\mathtt{Bob}$ is identical to
    the situation in which Alice tried to set up a connection to Bob, so
    Bob now thinks it is talking to Alice, even though Alice never tried
    to communicate with Bob.

The security property is violated. In particular, Bob, duped by Corey,
finished the protocol with Alice and received $A_N$, and even though Bob
and Alice are both honest, Corey has a copy of $A_N$. So Corey is now
able to impersonate Alice to Bob (but not vice versa because Alice did
not try to authenticate Bob).

## Exercises 


Figure out how to fix the protocol.

There were two versions of the Needham-Schroeder protocol: the Symmetric
Key protocol and the Public Key protocol. In this chapter we only
discussed the latter, but the former also had a problem. See if you can
find it using Harmony.

