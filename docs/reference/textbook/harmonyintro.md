
# Introduction to Harmony 

Harmony is a programming language that borrows much of Python's syntax.
Like Python, Harmony is an imperative, dynamically typed, and garbage
collected programming language. There are also some important
differences:

-   Harmony only supports basic operator precedence or associativity.
    Use parentheses liberally to remove ambiguity.

-   Harmony does not (currently) support floating point, iterators, or
    I/O; Harmony does support **for** loops and various
    "comprehensions."

-   Python is object-oriented, supporting classes with methods and
    inheritance; Harmony has objects but does not support classes. On
    the other hand, Harmony supports pointers to objects and methods.

There are also less important ones that you will discover as you get
more familiar with programming in Harmony.


```python
const N = 10

def triangle(n):   # computes the n’th triangle number
    result = 0
    for i in {1..n}:      # for each integer from 1 to n inclusive
        result += i      # add i to result
x = choose({0..N})       # select an x between 0 and N inclusive
assert triangle(x) == ((x * (x + 1)) / 2)
```

Here is a simple example of a Harmony program. (The code for examples in
this book can be found in the `code` folder under the name listed in the
caption of the example.) The example is sequential and has a method
`triangle` that takes an integer number as argument. Each method has a
variable called *result* that eventually contains the result of the
method (there is no **return** statement in Harmony). The method also
has a variable called *n* containing the value of the argument. The {
*x..y* } notation generates a set containing the numbers from *x* to *y*
(inclusive). (Harmony does not have iterators and in particular does not
have a `range` operator.) The last two lines in the program are the most
interesting. The first assigns to *x* some unspecified value in the
range `0..N` and the second verifies that $\mathtt{triangle}(x)$ equals
$x(x+1)/2$.

"Running" this Harmony program will try all possible executions, which
includes all possible values for $x$. Try it out (here `$` represents a
shell prompt):

    $ harmony triangle.hny
    #states 13
    13 components, 0 bad states
    No issues
    $

(For this to work, make sure `harmony` is in your command shell's search
path.) Essentially, the $\texttt{choose}($S$)$ operator provides the
input to the program by selecting some value from the set $S$, while the
$\textbf{assert}$ statement checks that the output is correct. If the
program is correct, the output of Harmony is the size of the "state
graph" (13 states in this case). If not, Harmony also reports what went
wrong, typically by displaying a summary of an execution in which
something went wrong.

In Harmony, constants have a default value, but those can be overridden
on the command line using the `-c` option. For example, if you want to
test the code for `N = 100`, run:

    $ harmony -c N=100 triangle.hny
    #states 103
    103 components, 0 bad states
    No issues
    $

## Exercises 


See what happens if, instead of initializing *result* to 0, you
initialize it to 1. (You do not need to understand the error report at
this time. They will be explained in more detail in .)

Write a Harmony program that computes squares by repeated adding. So,
the program should compute the square of $x$ by adding $x$ to an initial
value of 0 $x$ times.

