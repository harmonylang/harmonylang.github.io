
# Alternating Bit Protocol 


```python
sequential s_chan, r_chan
s_chan = r_chan = ()
s_seq = r_seq = 0

def net_send(pchan, m, reliable):
    !pchan = m if (reliable or choose({ False, True })) else ()

def net_recv(pchan):
    result = !pchan

def app_send(payload):
    s_seq = 1 – s_seq
    let m = { .seq: s_seq, .payload: payload }:
        var blocked = True
        while blocked:
            net_send(?s_chan, m, False)
            let response = net_recv(?r_chan):
                blocked = (response == ()) or (response.ack != s_seq)
            

def app_recv(reliable):
    r_seq = 1 – r_seq
    var blocked = True
    while blocked:
        let m = net_recv(?s_chan):
            if m != ():
                net_send(?r_chan, { .ack: m.seq }, reliable)
                if m.seq == r_seq:
                    result = m.payload
                    blocked = False
```

<figcaption>Figure 26.1 (
<a href=https://harmony.cs.cornell.edu/code/abp.hny>code/abp.hny</a>): 
Alternating Bit Protocol </figcaption>


```python
import abp
const NMSGS = 5

def sender():
    for i in {1..NMSGS}:
        abp.app_send(i)
    

def receiver():
    for i in {1..NMSGS}:
        let payload = abp.app_recv(i == NMSGS):
            assert payload == i
spawn sender()
spawn receiver()
```

<figcaption>Figure 26.2 (
<a href=https://harmony.cs.cornell.edu/code/abptest.hny>code/abptest.hny</a>): 
Test code for alternating bit protocol </figcaption>

A *distributed system* is a concurrent system in which a collection of
threads communicate by message passing, much the same as in the actor
model. The most important difference between distributed and concurrent
systems is that the former takes *failures* into account, including
failures of threads and failures of shared memory. In this chapter, we
will consider two actors, Alice and Bob. Alice wants to send a sequence
of application messages to Bob, but the underlying network may lose
messages. The network does not re-order messages: when sending messages
$m_1$ and $m_2$ in that order, then if both messages are received, $m_1$
is received before $m_2$. Also, the network does not create messages out
of nothing: if message *m* is received, then message *m* was sent.

It is useful to create an abstract network that reliably sends messages
between threads, much like the FIFO queue in the `synch` module. For
this, we need a network protocol that Alice and Bob can run. In
particular, it has to be the case that if Alice sends application
messages $m_1, ..., m_n$ in that order, then if Bob receives an
application message *m*, then $m = m_i$ for some *i* and, unless $m$ is
the very first message, Bob will already have received application
messages $m_1, ..., m_{i-1}$ (safety). Also, if the network is fair and
Alice sends application message *m*, then eventually Bob should deliver
*m* (liveness).

The *Alternating Bit Protocol* is suitable for our purposes. We assume
that there are two unreliable network channels: one from Alice to Bob
and one from Bob to Alice. Alice and Bob each maintain a
zero-initialized *sequence number*, *s_seq* and *r_seq* resp. Alice
sends a network message to Bob containing an application message as
*payload* and Alice's sequence number as *header*. When Bob receives
such a network message, Bob returns an *acknowledgment* to Alice, which
is a network message containing the same sequence number as in the
message that Bob received.

In the protocol, Alice keeps sending the same network message until she
receives an acknowledgment with the same sequence number. This is called
*retransmission*. When she receives the desired sequence number, Alice
increments her sequence number. She is now ready to send the next
message she wants to send to Bob. Bob, on the other hand, waits until he
receives a message matching Bob's sequence number. If so, Bob *delivers*
the payload in the message and increments his sequence number. Because
of the network properties, a one-bit sequence number suffices.

We can model each channel as a variable that either contains a network
message or nothing (we use () in the model). Let *s_chan* be the channel
from Alice to Bob and *r_chan* the channel from Bob to Alice.
`net_send`(*pchan*, *m*, *reliable*) models sending a message *m* to
!*pchan*, where *pchan* is either ?*s_chan* or ?*r_chan*. The method
places either *m* (to model a successful send) or () (to model loss) in
!*pchan*. The use of the *reliable* flag will be explained later.
`net_recv`(*pchan*) models checking !*pchan* for the next message.

Method `app_send`(*m*) retransmits *m* until an acknowledgment is
received. Method `app_recv`(*reliable*) returns the next successfully
received message. Figure 26.2 shows how the methods may be used to
send and receive a stream of `NMSGS` messages reliably. It has to be
bounded, because model checking requires a finite model.

Only the last invocation of `app_recv`(*reliable*) is invoked with
*reliable* = `True`. It causes the last acknowledgment to be sent
reliably. It allows the receiver (Bob) to stop, as well as the sender
(Alice) once the last acknowledgment has been received. Without
something like this, either the sender may be left hanging waiting for
the last acknowledgment, or the receiver waiting for the last message.

## Exercises 


[Chapter 22](actor.md) explored the *client/server model*. It is popular in
distributed systems as well. Develop a protocol for a single client and
server using the same network model as for the ABP protocol. Hint: the
response to a request can contain the same sequence number as the
request.

Generalize the solution in the previous exercise to multiple clients.
Each client is uniquely identified. You may either use separate channel
pairs for each client, or solve the problem using a single pair of
channels.

