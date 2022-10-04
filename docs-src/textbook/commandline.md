# Harmony Command Line

`harmony [options] filename`

## Description

`harmony` is a compiler and model checker for the Harmony programming
language. `harmony` compiles Harmony into bytecode and then model checks
the bytecode. The result is analyzed for failing assertions and
invariants, non-terminating conditions such as deadlock and infinite
loops, race conditions, deviations from specifications, and busy
waiting. There are three phases:

-   *compile*: parses Harmony source code and generates Harmony virtual
    machine code;

-   *model check*: generates a graph of all reachable states from the
    Harmony virtual machine code while checking for safety violations;

-   *analysis*: checks the graph for non-termination, race conditions,
    and busy waiting.

The Harmony file name extensions are as follows:

-   `.hny`: Harmony source code;

-   `.hvm`: Harmony virtual machine code (in JSON format);

-   `.hco`: Harmony output (in JSON format);

-   `.hvb`: Harmony verbose output (human readable);

-   `.hfa`: Harmony finite automaton, describing the possible \<print\>
    outputs (in JSON format).

In addition, `harmony` can also generate `.tla` (TLA+), `.htm` (HTML),
`.gv`: (Graphviz DOT version of `.hfa` output), and `.png`: (PNG version
of `.hfa` output).

By default, running “`harmony x.hny`’ will generate `x.hvm`, `x.hco`,
`x.hvb`, and `x.hvm` files. Harmony will also, by default, automatically
start a web browser to display the `x.hvm` file. Various options can be
used to change the behavior.

When importing a module using \<import x\>, `harmony` will try to find
the corresponding `.hny` file in the following order:

1.  check if the module file is specified with the `-m` or `–module`
    option;

2.  see if a file by the name \<x.hny\> is present in the same directory
    as the source file;

3.  see if a file by the name \<x.hny\> is present in the installation’s
    `modules` directory.

## Options

#### Output file options:

-   `-o` *filename.gv*: specify the name of the file where the
    `graphviz` (DOT) output should be stored;

-   `-o` *filename.hco*: specify the name of the file where model
    checker output should be stored;

-   `-o` *filename.hfa*: specify the name of the file where the Harmony
    finite automaton should be stored;

-   `-o` *filename.htm*: specify the name of the file where the HTML
    output should be stored;

-   `-o` *filename.hvb*: specify the name of the file where the verbose
    output should be stored;

-   `-o` *filename.hvm*: specify the name of the file where the Harmony
    virtual machine code should be stored;

-   `-o` *filename.png*: specify the name of the file where the PNG
    output should be stored;

-   `-o` *filename.tla*: generate a TLA+ file specifying the behaviors
    of the Harmony virtual machine code;

#### Other options:

-   `-a`: compile only and list machine code (with labels);

-   `-A`: compile only and list machine code (without labels);

-   `-B` `filename.hfa`: check Harmony code against output behaviors
    described in `filename.hfa` (result of another Harmony run);

-   `-c`, `–const` \<constant=expression\>: set the value of the given
    constant (which must be defined in the code) to the result of
    evaluating the given expression;

-   `-m`, `–module` \<module=filename.hny\>: load the given module
    instead of looking in default locations;

-   `–noweb`: do not start a web browser upon completion;

-   `-v`, `–version`: print the `harmony` version number.