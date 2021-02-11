# The `set` module

The `set` module implements the following methods:


| Method | Description |
| ------ | ------- |
| `issubset(s, t)` | returns whether `s` is a subset of `t` |
| `issuperset(s, t)` | returns whether `s` is a superset of `t` |

<br />

For Python programmers: note thats `<= t` does not check if `s` is a subset of `t` when `s` and `t` are sets, as “<=” implements a total order on all Harmony values including sets.