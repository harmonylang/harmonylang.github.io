
# Installing and Running Harmony 

There are currently three options for using Harmony:

1.  You can download and install a command-line version of Harmony on
    your computer;

2.  You can download and install *HarmonyLang*, a VSCode plug-in for
    Harmony;

3.  You can run Harmony programs in the cloud using *Harmony IDE*.

Below you can find more information on each of these options.

## Command-Line

You can get the latest released developer version of Harmony by
downloading from [harmony.cs.cornell.edu](harmony.cs.cornell.edu). It
includes the latest bug fixes and features at any time. Harmony is
developed and maintained by the author on both MacOSX and Linux, and so
these are the preferred platforms at this time. A Windows version is
also available, but may not be the latest version and is currently not
as well supported.

When you download the `.zip` file, you will get the following files:

-   `README.txt`: installation documentation;

-   `archive.xml`: portable compressed archive of the code base;

-   `install.py`: Python3 program to install and update the code base.

First place this directory (folder) where you would like it---the
`Downloads` folder is at best a good temporary place. You can put the
directory in your home directory, for example.

Installation requires Python3 and a 64-bit C compiler. The developer
uses recent versions of `gcc` and `clang` for development. Run
`python3 install.py` to install the code base. It extracts files from
archive.xml and installs them in the current directory. It will try to
compile the model checker using `gcc`. If that fails under Windows, it
will install an executable that is pre-compiled on a Windows 10 machine.
If these options do not work, you can compile the file `charm.c` by hand
using a 64-bit C compile and place the output in `charm.exe`.

After installation, there is a `harmony` file for use under MacOSX and
Linux, and a `harmony.bat` file for use under Windows. You should be
able to run `harmony –help` in any of these environments.

If you would like to run `harmony` from any directory, you have to add
the current directory to your search path. Under MacOSX and Linux, you
will have to set the `PATH` environment variable. See
<http://www.linux-migration.org/ch02s06.html> for more information.
Under Windows, search \"Edit environment variables\" in the search bar.
You can add the directory either to the `Path` associated with your
account or to the system `Path`. If you do not install `harmony` in your
search path, you may have to run `./harmony` in the installation
directory instead of just `harmony`.

The installation directory will have the following subdirectories:

-   `code`: contains all the code examples from this book;

-   `modules`: contains the Harmony modules;

-   `python`: contains the Python examples from the book.

For example, you can try `harmony code/Diners.hny` to run the Dining
Philosophers code. Harmony currently produces three output files:

-   `code/Diners.hvm`: the bytecode in JSON format;

-   `code/Diners.hco`: the output of the model checker in JSON format;

-   `code/Diners.htm`: the model checker output converted to HTML
    format.

You are probably only interested to see the last one, which you should
be able to view in any web browser of your choice, including Safari,
Chrome, Edge, or Firefox.

You can see if you are running the latest version of Harmony at any time
by running `Python3 install.py –check`. If you would like to update your
installation, run `Python3 install.puy –update`.

## HarmonyLang for VSCode

The VSCode plug-in, developed by Kevin Sun and Anthony Yang, is
available from the VSCode market place:
<https://marketplace.visualstudio.com/items?itemName=kevinsun-dev-cornell.harmonylang>.
This page comes with installation documentation. VSCode also sports a
wonderful animator for Harmony output.

HarmonyLang is regularly updated to include the latest Harmony
distribution.

## Harmony IDE for the cloud

`Harmony IDE` is an Integrated Development Environment for Harmony, also
developed by Kevin Sun and Anthony Yang, that runs in the cloud. An
important advantage of using `Harmony IDE` is that you do not have to
install anything. You can even run in on your smartphone. However, since
Harmony programs can use significant compute resources, `Harmony IDE`
must put a limit on the amount of compute resources you can use. So,
while `Harmony IDE` is currently a great way to try out Harmony, if you
become a serious user of Harmony you will probably want to install
either the command-line version or `HarmonyLang`.
