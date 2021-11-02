
# Actors and Message Passing 





```python
import synch
const NCLIENTS = 3
server_queue = synch.Queue()

def server():
    var counter = 0
    while True:
        let q = synch.get(?server_queue):   # await request
            synch.put(q, counter)           # send response
            counter += 1
spawn eternal server()
sequential done
done = [False,] * NCLIENTS

def client(client_queue):
    synch.put(?server_queue, client_queue)      # send request
    let response = synch.get(client_queue):     # await response
        done[response] = True
    await all(done)
    assert done == ([True,] * NCLIENTS)
alice_queue = synch.Queue()
spawn client(?alice_queue)
bob_queue = synch.Queue()
spawn client(?bob_queue)
charlie_queue = synch.Queue()
spawn client(?charlie_queue)
```

Some programming languages favor a different way of implementing
synchronization using so-called *actors*. Actors are
threads that have only private memory and communicate through *message
passing*. See for an illustration. Given that there is no shared memory
in the actor model (other than the message queues, which have built-in
synchronization), there is no need for critical sections. Instead, some
sequential thread owns a particular piece of data and other threads
access it by sending request messages to the thread and optionally
waiting for response messages. Each thread handles one message at a
time, serializing all access to the data it owns. As message queues are
FIFO (First-In-First-Out), starvation is prevented.

The actor synchronization model is popular in a variety of programming
languages, including Erlang and Scala. Actor support is also available
through popular libraries such as Akka, which is available for various
programming languages. In Python, Java, and C/C++, actors can be easily
emulated using threads and *synchronized queues* (aka *blocking queues*)
for messaging. Each thread would have one such queue for receiving
messages. Dequeuing from an empty synchronized queue blocks the thread
until another thread enqueues a message on the queue.

The `synch` library supports a synchronized message queue, similar to
the `Queue` object in Python. Its interface is as follows:

-   `Queue()` returns a new message queue;

-   `put`($q$, *item*) adds *item* to the queue pointed to by $q$;

-   `get`($q$) waits for and returns an item on the queue pointed to by
    $q$.

For those familiar with counting semaphores: note that a `Queue` behaves
much like a zero-initialized counting semaphore. `put` is much like `V`,
except that it is accompanied by data. `get` is much like `P`, except
that it also returns data. Thus, synchronized queues can be considered a
generalization of counting semaphores.

illustrates the actor approach. There are three client threads that each
want to be assigned a unique identifier from the set $\{ 0, 1, 2 \}$.
Normally one would use a shared 0-initialized counter and a lock. Each
client would acquire the lock, get the value of the counter and
increment it, and release the lock. Instead, in the actor approach the
counter is managed by a separate server thread. The server never
terminates, so it is spawned with the keyword **eternal** to suppress
non-terminating state warnings. Each client sends a request to the
server, consisting in this case of simply the queue to which the server
must send the response. The server maintains a local, zero-initialized
counter variable. Upon receiving a request, it returns a response with
the value of the counter and increments the counter. No lock is
required. The code is tested using the *done* array.

This illustration is an example of the *client/server* model. Here a
single actor implements some service, and clients send request messages
and receive response messages. The model is particularly popular in
distributed systems, where each actor runs on a separate machine and the
queues are message channels. For example, the server can be a web
server, and its clients are web browsers.

## Exercises 


Actors and message queues are good for building pipelines. Develop a
pipeline that computes Mersenne primes (primes that are one less than a
power of two). Write four actors:

1.  an actor that generates a sequence of integers 1 through `N`;

2.  an actor that receives integers and forwards only those that are
    prime;

3.  an actor that receives integers and forwards only those that are one
    less than a power of two;

4.  an actor that receives integers but otherwise ignores them.

Configure two versions of the pipeline, one that first checks if a
number is prime and then if it is one less than a power of two, the
other in the opposite order. Which do you think is better?

