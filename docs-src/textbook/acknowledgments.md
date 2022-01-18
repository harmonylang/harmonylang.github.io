
# Acknowledgments 

I received considerable help and inspiration from various people while
writing this book.

First and foremost I would like to thank my student Haobin Ni with whom I've had numerous discussions about the initial design of Harmony. Haobin even
contributed some code to the Harmony compiler.
Many thanks are also due to William Ma who refactored the Harmony code
to make it easier to maintain.
He also wrote the first version of the behavior automaton generator
and created the first graphs using the graphviz tool.
I have had lots of discussions with him about a wide range of
improvements to the Harmony language, many of which came to fruition.
I also want to thank Ariel Kellison with whom I discussed approaches
to formally specify the Harmony virtual machine in TLA+.

Kevin Sun and Anthony Yang built a beautiful VSCode extension for
Harmony called HarmonyLang and proceeded to build an animator for
Harmony executions and two cloud-based Harmony offerings, which you can
learn about at <http://harmony.cs.cornell.edu>. They also developed much
of that web site and made valuable suggestions for improvements to the
Harmony language.  Later they were joined by Shi Chong Zhao, who also
made significant contributions.  Kevin and Anthony continue to make
great contributions to the Harmony distribution.

Most of what I know about concurrent programming I learned from my
colleague Fred Schneider. He suggested I write this book after
demonstrating Harmony to him. Being a foremost security expert, he also
assisted significantly with the chapter on the Needham-Schroeder
protocol.

Leslie Lamport introduced me to using model checking to test properties
of a concurrent system. My experimentation with using TLC on Peterson's
Algorithm became an aha moment for me. I have learned so much from his
papers.

I first demonstrated Harmony to the students in my CS6480 class on
systems and formal verification and received valuable feedback from
them.

The following people contributed by making comments on or finding bugs
in early drafts of the book: Alex Chang, Anneke van Renesse, Brendon
Nguyen, Hartek Sabharwal, Heather Zheng, Jack Rehmann, Jacob Brugh, Liam
Arzola, Lorenzo Alvisi, Maria Martucci, Phillip O'Reggio, Saleh Hassen,
Sunwook Kim, Terryn Jung, Trishita Tiwari, Xiangyu Zhang,
Yidan Wang, Zhuoyu Xu, and Zoltan Csaki.

Finally, I would like to thank my family who had to suffer as I obsessed
over writing the code and the book, at home, during the turbulent months
of May and June 2020.