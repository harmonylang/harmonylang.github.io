# The Harmony Virtual Machine

The Harmony Virtual Machine (HVM) has the following state:

| State | Description |
| ------ | ------- |
| `code` | a list of HVM machine instructions |
| `labels` | a dictionary of atoms to program counters |
| `variables` | a dictionary mapping atoms to values |
| `ctxbag` | a bag of runnable contexts |
| `stopbag` | a bag of stopped contexts |
| `choosing` | if not None, indicates a context that is choosing |

<br />
There is initially a single context with name `__init__/()` and program counter 0. It starts executing in atomic mode until it finishes executing the last `Return` instruction. Other threads, created through spawn statements, do not start executing until then.

A *step* is the execution of a single HVM machine instruction by a context. Each step generates a new state. When there are multiple contexts, the HVM can interleave them. However, trying to interleave every step would be needlessly expensive, as many steps involve changes to a context that are invisible to other contexts.

A *stride* can involve multiple steps. The following instructions start a new stride: `Load`, `Store`, `AtomicInc`, and `Continue`. The HVM interleaves stides, not steps. Like steps, each stride involves a single context. Unlike a step, a stride can leave the state unchanged (because its steps lead back to where the stride started).

Executing a Harmony program results in a graph where the nodes are Harmony states and the edges are strides. When a state is `choosing`, the edges from that state are by a single context, one for each choice. If not, the edges from the state are one per context.

Consecutive strides by the same thread are called a *turn*. Each state maintains the shortest path to it from the initial state in terms of turns. The diameter of the graph is the length of the longest path found in terms of turns.

If some states have a problem, the state with the shortest path is reported. Problematic states include states that experienced exceptions. If there are no exceptions, Harmony computes the strongly connected components (SCCs) of the graph (the number of such components are printed as part of the output). The sink SCCs should each consist of a terminal state without any threads. If not, again the state with the shortest path is reported.

If there are no problematic states, Harmony reports "no issues found" and outputs in the HTML file the state with the longest path.