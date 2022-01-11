## The `alloc` module

The `alloc` module supports thread-safe (but not interrupt-safe) dynamic
allocation of shared memory locations. There are just two methods:

| Method | Description |
| ------ | ------- |
| `malloc(v)` | return a pointer to a memory location initialized to $v$ |
| `free(p)` |   free an allocated memory location $p$ |

The usage is similar to `malloc` and `free` in C. `malloc`() is
specified to return `None` when running out of memory, although this is
an impossible outcome in the current implementation of the module.