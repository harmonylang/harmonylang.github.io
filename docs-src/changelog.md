# Changelog

## v1.3
 - Added print statements
 - Added DFA output graphs
 - Removed the `@` tag from labeled statements
 - Bug fixes

## v1.2
 - Added `let-when` statements
  - Renamed `once` to `when`
 - Added `possibly` statement
 - Added `atomically`
 - Added "-i" flag
 - All labels within a module are now global
 - Replaced all non-constant "let" with "var
 - Atomic blocks / assertion checking now "lazy"
 - Improved error reporting
 - Improved parsing and robustness
 - Bug fixes

## v1.1
 - Now detects busy waiting and data races
 - New `sequential` keyword to tag sequentially consistent variables 
 - Removed "interlock" term
 - Improved error reporting
 - Improved parsing and robustness
 - Bug fixes

## v1.0
 - Rewrote model checker in C for much faster performance
 - Removed semicolons as a syntax requirement
 - Updated imports syntax
 - Requires Python3 and GCC in path to run

## v0.9
 - Initial release of the Harmony Language
 - Model checker for concurrent programs
 - HTML output with steps and shortest path to failure
 - Required Python3 to run