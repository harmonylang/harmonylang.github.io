# List of Statements

Harmony currently supports the following statements:

| Statement | Description |
| ------ | ------- |
| `lv = [lv =]... e` | `lv` is an lvalue and `e` is an expression |
| `lv [op] = e` | op is one of `+`,`-`,`*`,`/`,`//`,`%`,`\&`,`|`,`\^`,`and`, and `or` |
| `pass` | do nothing |
| `del lv` | delete |
| `assert b [, e]` | `b` is a boolean. Optionally report value of expression `e` |
| `const a = e` | `a` is a bounded variable, `e` is a constant expression |
| `def m a: S` | `m` is an identifier, `a` a bounded variable, `S` a list of statements |
| `let a = e [let ...]: S` | `a` is a bounded variable, `e` is an expression, `S` a list of statements |
| `if b: S else: S` | `b` is a boolean, `S` a list of statements |
| `while b: S` | `b` is a boolean, `S` a list of statements |
| `await b` | `b` is a boolean |
| `for a in e: S` | `a` is a bounded variable, `e` is a set, `S` a list of statements |
| `atomic: S` | `S` a list of statements |
| `spawn me[, t]` | `m` is a method, `e` is an expression, `t` is the initial thread-local state (an expression) |
| `trap m e` | `m` is a method and `e` is an expression |
| `go c e` | `c`is a context, `e` is an expression |
| `import m, ...` | `m` identifies a module |
| `from m import ...` | `m` identifies a module |

<br />