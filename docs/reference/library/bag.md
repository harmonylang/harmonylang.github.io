# The `bag` module

The `bag` module has various useful methods that operate on bags or multisets:

| Method | Description |
| ------ | ------- |
| `empty()` | returns an empty bag |
| `fromSet(s)` | create a bag from sets |
| `fromList(t)` | convert list t into a bag |
| `count(b, e)` | count how many times e occurs in bag b |
| `bchoose(b)` | like `choose(s)`, but applied to a bag |
| `add(pb, e)` | add one copy of `e` to bag `!pb` |
| `remove(pb, e)` | remove one copy of e from bag `!pb` |
| `combinations(b, k)` | return set of all subbags of size k |
<br />