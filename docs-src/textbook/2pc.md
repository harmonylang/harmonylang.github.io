
# Transactions and Two Phase Commit 

Modern databases support multiple clients concurrently accessing the
data. They store data on disk, but we will ignore that in this book. (If
you want to model a disk, this is probably best done as a separate
thread that maintains the contents of the disk.) The complication we
address here is that databases may be *sharded*, where different parts
of the data are stored on different servers. The different servers may
even be under different authoritive domains, such as multiple banks
maintaining the accounts of their clients.

In database terminology, a *transaction* is an operation on a database.
The operation can be quite complex, and the execution of a transaction
should have the following two properties:

-   *all-or-nothing*: a transaction should either complete, or it should
    be a no-op. It should never partially execute and then give up
    because of some kind of error or something. Database people call
    this *atomicity*, but it is not the same kind of atomicity that we
    have been discussing in this book.

-   *serialized*: any two concurrent transactions should appear to
    execute in some order. Database people call this *isolation*: one
    transaction should not be able to witness the intermediate state of
    another transaction in execution.

We will use as an example a distributed database that maintains bank
accounts. For simplicity, we will model this as a collection of banks,
each maintaining a single account. There are two kinds of transactions:
*transfer* (similar to Exercise 19.2) and *check*. In this example, a transfer is a
transaction that moves some funds between two accounts. A check is a
transaction over all accounts and checks that the sum of the balances
across the accounts remains the same.

Executing such transactions must be done with care. Consider what would
happen if transactions are not all-or-nothing or are not serialized. A
transfer consists of two operations: withdrawing funds from one account
and depositing the same amount of funds in the other. These two
operations can be done concurrently, but if the withdrawal fails (for
example, because there are not sufficient funds in the source account)
then the whole transaction should fail and become a no-op. Even if this
is not the case, a concurrent check transaction may accidentally witness
a state in which either the withdrawal or the deposit happened, but not
both. And matters get more complicated with multiple concurrent
transfers.

```python title="2pc.hny"
network = {}

def send(m):
    atomically network |= { m }

def bank(self, balance):
    var status, received = (), {}
    while True:
        atomically when exists req in network – received when req.dst ==
self:
            received |= { req }
            if req.request == "withdraw":
                if (status != ()) or (req.amount > balance):
                    send({ .dst: req.src, .src: self, .response: "no" })
                else:
                    status = balance
                    balance –= req.amount
                    send({ .dst: req.src, .src: self, .response: "yes",
.funds: balance })
            elif req.request == "deposit":
                if status != ():
                    send({ .dst: req.src, .src: self, .response: "no" })
                else:
                    status = balance
                    balance += req.amount
                    send({ .dst: req.src, .src: self, .response: "yes",
.funds: balance })
            elif req.request == "commit":
                assert status != ()
                status = ()
            else:
                assert (status != ()) and (req.request == "abort")
                balance, status = status, ()
```

<figcaption>Figure 26.1 (<a href=https://harmony.cs.cornell.edu/code/2pc.hny>code/2pc.hny</a>): 
Two Phase Commit protocol: code for banks </figcaption>

The Two-Phase Commit protocol is a protocol that can be used
to implement transactions across multiple database servers---banks in
this case. Each transaction has a *coordinator* that sends a `PREPARE`
message to each of the servers involved in the transaction, asking them
to prepare to commit to their part in a particular transaction. A server
can either respond with `YES` if it is ready to commit and will avoid
doing anything that might jeopardize this (like committing a conflicting
transaction), or with `NO` if it does not want to participate in the
transaction. If all servers respond with `YES`, then the coordinator can
decide to *commit* the transaction. Otherwise the coordinator must
decide to *abort* the transaction. In the second phase, the servers that
responded with `YES` (if any) must be notified to inform them of the
coordinator's decision.

Different transactions can have different coordinators. In our
implementation, each bank and each coordinator is a thread. Figure 26.1
shows the code for a bank. The state of a bank consists of the following
local variables:

-   *self*: the bank's identifier;

-   *balance*: the current balance in the account;

-   *status*: either contains () if the bank is not involved in an
    ongoing transaction or contains the balance just before the
    transaction started;

-   *received*: the set of messages received and handled so far.

Messages sent to a bank are dictionaries with the following fields:

-   .*dst*: identifier of the bank;

-   .*src*: identifier of the coordinator that sent the message;

-   .*request*: request type, which is either .*withdraw*, .*deposit*,
    .*commit*, or .*abort*;

-   .*amount*: amount to withdraw or deposit.

A bank waits for a message destined to itself that it has not yet
received. In case of a withdrawal when the bank is idle and there are
sufficient funds, the bank saves the current balance in *status* to
indicate an ongoing transaction and what its original balance was. The
bank then responds with a .*yes* message to the coordinator, including
the new balance. Otherwise, the bank responds with a .*no* message.
Deposits are similar, except that it is not necessary to check for
sufficient funds. In case of a .*commit* message, the bank changes its
status to (), indicating that there is no ongoing transaction. In case
of a .*abort* message, the bank restores *balance* first.

```python
import list

def transfer(self, b1, b2, amt):
    send({ .dst: b1, .src: self, .request: "withdraw", .amount: amt })
    send({ .dst: b2, .src: self, .request: "deposit", .amount: amt })
    atomically let msgs = { m for m in network where m.dst == self }
    when { m.src for m in msgs } == { b1, b2 }:
        if all(m.response == "yes" for m in msgs):
            for m in msgs where m.response == "yes":
                send({ .dst: m.src, .src: self, .request: "commit" })
        else:
            for m in msgs where m.response == "yes":
                send({ .dst: m.src, .src: self, .request: "abort" })

def check(self, total):
    let allbanks = { (.bank, i) for i in { 1 .. NBANKS } }:
        for bank in allbanks:
            send({ .dst: bank, .src: self, .request: "withdraw",
.amount: 0 })
        atomically let msgs = { m for m in network where m.dst == self }
        when { m.src for m in msgs } == allbanks:
            assert all(m.response == "yes" for m in msgs) =>
                        (list.sum(m.funds for m in msgs) == total)
            for m in msgs where m.response == "yes":
                send({ .dst: m.src, .src: self, .request: "abort" })
let balances = { i:choose({ 0 .. MAX_BALANCE }) for i in { 1 .. NBANKS }
}:
    for i in { 1 .. NBANKS }:
        spawn eternal bank((.bank, i), balances[i])
    for i in { 1 .. NCOORDS }:
        if choose({ "transfer", "check" }) == .transfer:
            let b1 = choose({ (.bank, j) for j in { 1 .. NBANKS }})
            let b2 = choose({ (.bank, j) for j in { 1 .. NBANKS }} – {
b1 }):
                spawn transfer((.coord, i), b1, b2, 1)
        else:
            spawn check((.coord, i), list.sum(balances))
```

<figcaption>Figure 26.2 (<a href=https://harmony.cs.cornell.edu/code/2pc.hny>code/2pc.hny</a>): 
Two Phase Commit protocol: code for transaction coordinators
</figcaption>

Figure 26.2 contains the code for transfers and inquiries, as well as
tests. The `receive`() method is used by coordinators in an
**atomically** **when** **exists** statement to wait for a response from
each bank involved in a transaction. Argument `self` is the identifier
of the coordinator and `sources` is the set of banks. It returns the
empty set if there not yet responses from all banks. Otherwise it
returns a singleton set containing the set of responses, one for each
source.

The `transfer`() method contains the code for the transfer transaction.
Argument *self* is the identifier of the coordinator, *b1* is the source
bank, *b2* is the destination bank, and *amt* is the amount to transfer.
The coordinator sends a `PREPARE` message containing a .*withdraw*
request to *b1* and a `PREPARE` message containing a .*deposit* request
to *b2*. It then waits for responses from each. If both responses are
.*yes*, then it commits the transaction, otherwise it aborts the
transaction.

The `check`() method checks if the sum of the balances equals `total`,
the sum of the initial balances. The code is similar to `transfer`,
except that it always aborts the transaction---there is no need to ever
commit it. As a code-saving hack: the balance inquiry is done by
withdrawing \$0.

As for testing, the initial balances are picked arbitrarily between 0
and `MAX_BALANCE` (and Harmony as always will try every possible set of
choices). Each coordinator chooses whether to do a transfer or a check.
In case of a transfer, it also chooses the source bank and the
destination bank.

While the protocol perhaps seems simple enough, there are a lot of
**if** statements in the code, making it hard to reason about
correctness. Model checking is useful to see if there are corner cases
where the code does not work. While confidence increases by increasing
the number of banks or the number of coordinators, doing so quickly
increases the number of possible states so that model checking may
become infeasible.

## Exercises 

**26.1** In Exercise 19.2 the code ran into a deadlock. Can the code in this chapter run into a
deadlock? Explain.

**26.2** Transactions can fail for two reasons: a transfer transaction can fail
because of insufficient funds, but in general transaction can fail if
there is a conflict with another transaction. The latter can be fixed by
retrying the transaction until it commits. Implement this.

**26.3** One way to reduce the number of conflicts between transactions is to
distinguish read and write operations. Two read operations (in our case,
operations that withdraw \$0) do not conflict, so a bank could have
multiple ongoing read operations for different transactions. Implement
this.

**26.4** Two-phase commit can tolerate servers failing. If a server does not
respond within some reasonable amount of time, the coordinator can abort
the transaction. Implement this.

