# The `hoare` module

The `hoare` module implements support for Hoare-style monitors and condition variables.

| Method | Description |
| ------ | ------- |
| `Monitor()` | return a monitor mutex |
| `enter(m)` | enter a monitor. `m` points to a monitor mutex |
| `exit(m)` | exit a monitor |
| `Condition()` | return a condition variable |
| `wait(c, m)` | wait on condition variable pointed to be `c` in monitor pointed to by `m` |
| `signal(c, m)` | signal a condition variable |

<br />