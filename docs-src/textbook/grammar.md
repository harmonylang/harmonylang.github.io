# Simplified Grammar

The next pages show a compact version of the complete Harmony grammar.
The precedence rules are loosely as follows. Application binds most strongly.
Next are unary operators.  Next are binary operators. Thus `-a[1] - a[2]`
parses as `(-(a[1])) - (a[2])`. `!a[1]` parses as `!(a[1])`. Harmony will
complain about ambiguities such as `a - b + c`. The grammar ignores indentation rules.

```
block: statement [[NEWLINE | ';'] statement]*;

statement
    : e     # usually a function call
    | e '=' [e '=']* e        # assignment
    | e aug_assign e           # augmented assignment
    | id: statement     # labeled statement
    | assert e [',' e]
    | atomically statement
    | atomically ':' block
    | await e
    | const bv '=' e
    | def bv [returns id]? ':' block
    | del e [',' e]*
    | finally e
    | from id import id [ ',' id]*
    | go e e
    | if e ':' block [elif e ':' block]* [else ':' block]?
    | import id [ ',' id]*
    | invariant e
    | pass
    | print e
    | sequential id
    | spawn e e
    | trap e e
    | var bv '=' e
    | while e ':' block
    | letwhen ':' block      # let/when statement
    | comprehension ':' block      # for statement
    ;

comprehension: for_clause [for_clause | where_clause]*;
letwhen: [let_clause | when_clause]+;
for_clause: for bv in e;
where_clause: where e;
let_clause: let bv '=' e;
when_clause: when e | when exists bv in e;

aug_assign
    : '+=' | '-=' | '*=' | '**=' | '/=' | '//=' | '%=' | 'mod=' | '>>=' | '<<=
    | 'and-' | 'or=' | '=>=' | '&=' | '|=' | '^='
    ;
<{:end:}>
```

```
e   # expression
    : False | True | None | '{:}'
    | [0-9]+ | 0x[0-9a-fA-F]+ | 0b[0-1]+ | 0o[0-7]+ # integer
    | "..." | '...' | """...""" | ' ' '...' ' ' | '.' id # string forms
    | id
    | unary e
    | e binary e
    | e e                   # application
    | '(' [e,]* e? ')'      # tuple/list
    | '[' [e,]* e? ']'      # tuple/list
    | '{' [e,]* e? '}'      # set
    | '{' [e ':' e,]* [e ':' e] '}' # dictionary
    | '{' e '..' e '}'      # range
    | e comprehension       # list comprehension
    | '{' e comprehension '}'       # set comprehension
    | '{' e ':' e comprehension '}' # dict comprehension
    | e if e else e
    | lambda bv: e end
    | atomically e
    | save e
    | stop id
    ;

unary
    : '-' | '?' | '!' | '|' | '&' | '^' | abs | any | all | choose
    | countLabel | len | keys | max | min | not | str | type
    ;

binary
    : '+' | '-' | '*' | '/' | '//' | '%' | mod | '~' | '<<' | '>>'
    | '==' | '!=' | '<' | '<=' | '>' | '>='
    | not? in | not? and | not? or |  not? '=>' 
    ;

bv # bounded variable(s)
    : id
    | [bv ',']+ bv
    | '(' bv ')'
    | '[' bv ']'
    ;

id: [_a-zA-Z][_a-zA-Z0-9]*; # identifier
```