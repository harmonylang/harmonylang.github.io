# Introduction

Harmony is a Python-like programming language for testing and experimenting with concurrent programs. Instead of "running" code, Harmony programs are model-checked so that all corner cases are explored. If there is a problem, Harmony provides a short but detailed example of an execution that leads to the problem.

Here is [Peterson's Algorithm](https://en.wikipedia.org/wiki/Peterson%27s_algorithm) in Harmony, along with code to verify mutual exclusion:

```python title="peterson.hny"
--8<-- "Peterson.hny"
```

Harmony allows two sources of non-determinism: interleaving of concurrent process executions and choose(S) expressions that select some element from set S. Running Harmony finds that no interleaving and no possible choices lead to the assertion being violated. Moreover, Harmony also finds that processes do not get stuck, indefinitely waiting to enter the critical section.

# Get Started

Learning programming in Harmony should be straightforward to those familiar with Python or similar languages.

_On Concurrent Programming in Harmony_, written by Prof. Robbert Van Renesse at Cornell University, remains the primary source of documentation for the Harmony language. It contains the documentation for the language and built-in libraries, along with a full course on concurrent programming.

[Read it online](../../textbook) or [download the latest version](https://harmony.cs.cornell.edu/book.pdf)!

_On Concurrent Programming in Harmony_ is licenced under the terms of the Creative Commons Attribution NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) at [http://creativecommons.org/licenses/by-nc-sa/4.0](http://creativecommons.org/licenses/by-nc-sa/4.0).