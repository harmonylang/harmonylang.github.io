# Installation

## Requirements

The Harmony compiler requires both [Python 3](https://www.python.org/downloads/) and the [GCC](https://gcc.gnu.org/) compiler. Both must be on your PATH environment variable for Harmony to function.

> The Harmony team also offers remote compilation and analysis solutions that do not require any downloads. Try out the online IDE here: [https://harmony.cs.cornell.edu/ide/](https://harmony.cs.cornell.edu/ide/)

### MacOS and Linux

 - Download and install [Python 3](https://www.python.org/downloads/)
 - Open terminal and verify that the `python3` command works
   - If not, add `export PATH=/usr/local/share/python:$PATH` to your `~/.bash_profile` and/or `~/.zshrc`
 - Open terminal and verify that the `gcc` command works
   - If not, install GCC, either through Homebrew on Mac (`brew install gcc`) or apt-get on Ubuntu and other distros (`sudo apt-get install build-essential`)

### Windows

 - Download and install [Python 3](https://www.python.org/downloads/)
 - Open terminal and verify that the `python3` command works
   - If not, [add your python install directory to your PATH](https://datatofish.com/add-python-to-windows-path/)
 - Install GCC (http://mingw-w64.org/doku.php).
    - At the Settings window, make sure you select the x86-64
        architecture (instead of the default i686) during installation
    - After installation is complete, add `{installation path}\mingw64\bin` to your PATH environment variable
    - Open CMD and verify that the `gcc` command works

## Compiler Only
  - [Download](https://harmony.cs.cornell.edu) and unzip the Harmony compiler
  - Add harmony's directory to your PATH environment variable
    - see http://www.linux-migration.org/ch02s06.html
  - If you run harmony in the harmony directory, you may have to
    run "./harmony [args ...]" instead of just "harmony [args ...]"

## HarmonyLang - VSCode Extension
 - Download and Install [Visual Studio Code](https://code.visualstudio.com/)
 - Install the [HarmonyLang](https://marketplace.visualstudio.com/items?itemName=kevinsun-dev-cornell.harmonylang) extension from the Extension Marketplace