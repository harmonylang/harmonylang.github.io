# Introduction

Harmony is a Python-like programming language for testing and experimenting with concurrent programs. Instead of "running" code, Harmony programs are model-checked so that all corner cases are explored. If there is a problem, Harmony provides a short but detailed example of an execution that leads to the problem.

Here is [Peterson's Algorithm](https://en.wikipedia.org/wiki/Peterson%27s_algorithm) in Harmony, along with code to verify mutual exclusion:

```
flags = [ False, False ]
turn = choose({0, 1})
in_cs = [ False, False ] # to check mutual exclusion   

def process(self):
    # Enter critical section
    flags[self] = True
    turn = 1 - self
    while flags[1 - self] and (turn == (1 - self)):
        pass

    # Critical section is here
    in_cs[self] = True
    assert not in_cs[1 - self]
    in_cs[self] = False

    # Leave critical section
    flags[self] = False

spawn process(0)
spawn process(1)
```

Harmony allows two sources of non-determinism: interleaving of concurrent process executions and choose(S) expressions that select some element from set S. Running Harmony finds that no interleaving and no possible choices lead to the assertion being violated. Moreover, Harmony also finds that processes do not get stuck, indefinitely waiting to enter the critical section.

Learning programming in Harmony should be straightforward to those familiar with Python or similar languages. Harmony is described in a [free book](../reference/textbook.md) with many programming examples. Although in PDF format, the book has many hyperlinks to simplify navigation.