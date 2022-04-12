
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
Arzola, Lorenzo Alvisi, Maria Martucci, Nalu Concepcion, Phillip O'Reggio, Saleh Hassen,
Sunwook Kim, Terryn Jung, Trishita Tiwari, Xiangyu Zhang,
Yidan Wang, Zhuoyu Xu, and Zoltan Csaki.

Finally, I would like to thank my family who had to suffer as I obsessed
over writing the code and the book, at home, during the turbulent months
of May and June 2020.

## Bibliography

Agha, Gul. 1986. *Actors: A Model of Concurrent Computation in
Distributed Systems (Doctoral Dissertation)*. Cambridge, MA, USA: MIT
Press.

Andrews, Tony, Shaz Qadeer, Sriram K. Rajamani, Jakob Rehof, and Yichen
Xie. 2004. “Zing: A Model Checker for Concurrent Software.” In
*International Conference on Computer Aided Verification (CAV)*.

Attiya, Hagit, Amotz Bar-Noy, and Danny Dolev. 1995. “Sharing Memory
Robustly in Message-Passing Systems.” *J. ACM* 42 (1): 124–42.
<https://doi.org/10.1145/200836.200869>.

Bélády, László A., R. A. Nelson, and G. S. Shedler. 1969. “An Anomaly in
Space-Time Characteristics of Certain Programs Running in a Paging
Machine.” *Communications of the ACM* 12 (6): 349–53.

Ben-Or, Michael. 1983. “Another Advantage of Free Choice (Extended
Abstract): Completely Asynchronous Agreement Protocols.” In *Proceedings
of the 2nd Annual ACM Symposium on Principles of Distributed Computing*,
27–30. PODC’83. New York, NY, USA: ACM.
<https://doi.org/10.1145/800221.806707>.

Birrell, Andrew D. 1989. “An Introduction to Programming with Threads.”
SRC report 35. Palo Alto, CA, USA: Digital Systems Research Center.

Brinch Hansen, Per. 1973. *Operating System Principles*. USA:
Prentice-Hall, Inc.

Chang, Ernest, and Rosemary Roberts. 1979. “An Improved Algorithm for
Decentralized Extrema-Finding in Circular Configurations of Processes.”
*Commun. ACM* 22 (5): 281–83. <https://doi.org/10.1145/359104.359108>.

Clarke, Edmund M., E. Allen Emerson, and A. Prasad Sistla. 1986.
“Automatic Verification of Finite-State Concurrent Systems Using
Temporal Logic Specifications.” *ACM Trans. Program. Lang. Syst.* 8 (2):
244–63. <https://doi.org/10.1145/5397.5399>.

Coffman, Edward G., Melanie Elphick, and Arie Shoshani. 1971. “System
Deadlocks.” *ACM Comput. Surv.* 3 (2): 67–78.
<https://doi.org/10.1145/356586.356588>.

Corbató, Fernando J. 1969. “A Paging Experiment with the Multics
System.” In *In Honor of Philip m. Morse*, 217–28.

Cordeiro, Lucas, Pascal Kesseli, Daniel Kroening, Peter Schrammel, and
Marek Trtik. 2018. “JBMC: A Bounded Model Checking Tool for Verifying
Java Bytecode.” In *Computer Aided Verification (CAV)*, 10981:183–90.
LNCS. Springer.

Courtois, Pierre-Jacques, Frans Heymans, and David L. Parnas. 1971.
“Concurrent Control with ‘Readers’ and ‘Writers’.” *Commun. ACM* 14
(10): 667–68. <https://doi.org/10.1145/362759.362813>.

Diffie, Whitfield., and Martin E. Hellman. 1976. “New Directions in
Cryptography.” *IEEE Transactions on Information Theory* 22 (6): 644–54.
<https://doi.org/10.1109/TIT.1976.1055638>.

Dijkstra, Edsger W. approx. 1964. “EWD-108: Een Algorithme Ter
Voorkoming van de Dodelijke Omarming.”
<http://www.cs.utexas.edu/users/EWD/ewd01xx/EWD108.PDF>.

———. approx. 1962. “EWD-35: Over de Sequentialiteit van
Procesbeschrijvingen.”
<http://www.cs.utexas.edu/users/EWD/ewd00xx/EWD35.PDF>.

———. 1965. “EWD-123: Cooperating Sequential Processes.”

———. 1972. “EWD-329 Information Streams Sharing a Finite Buffer.”
<http://www.cs.utexas.edu/users/EWD/ewd03xx/EWD329.PDF>.

———. 1979. “EWD-703: A Tutorial on the Split Binary Semaphore.”
<http://www.cs.utexas.edu/users/EWD/ewd07xx/EWD703.PDF>.

Downey, Allen B. 2009. *The Little Book of Semaphores*. Green Tea Press.
<http://greenteapress.com/semaphores/LittleBookOfSemaphores.pdf>.

Gray, Jim N. 1978. “Notes on Data Base Operating Systems.” In *Operating
Systems: An Advanced Course*, edited by R. Bayer, R. M. Graham, and G.
Seegmüller, 393–481. Berlin, Heidelberg: Springer Berlin Heidelberg.
<https://doi.org/10.1007/3-540-08755-9_9>.

Havelund, Klaus, and Thomas Pressburger. 2000. “Model Checking Java
Programs Using Java PathFinder.” *International Journal on Software
Tools for Technology Transfer* 2: 366–81.

Havender, James W. 1968. “Avoiding Deadlock in Multitasking Systems.”
*IBM Syst. J.* 7 (2): 74–84. <https://doi.org/10.1147/sj.72.0074>.

Herlihy, Maurice P., and Jeannette M. Wing. 1987. “Axioms for Concurrent
Objects.” In *Proceedings of the 14th ACM SIGACT-SIGPLAN Symposium on
Principles of Programming Languages*, 13–26. POPL ’87. New York, NY,
USA: Association for Computing Machinery.
<https://doi.org/10.1145/41625.41627>.

———. 1990. “Linearizability: A Correctness Condition for Concurrent
Objects.” *ACM Trans. Program. Lang. Syst.* 12 (3): 463–92.
<https://doi.org/10.1145/78969.78972>.

Hewitt, Carl, Peter Bishop, and Richard Steiger. 1973. “A Universal
Modular ACTOR Formalism for Artificial Intelligence.” In *Proceedings of
the 3rd International Joint Conference on Artificial Intelligence*,
235–45. IJCAI’73. San Francisco, CA, USA: Morgan Kaufmann Publishers
Inc.

Hoare, C. A. R. 1973. “Towards a Theory of Parallel Programming.” In
*Operating Systems Techniques*, edited by C. A. R. Hoare and R. H.
Perrott. New York, NY: Academic Press.

———. 1974. “Monitors: An Operating System Structuring Concept.” *Commun.
ACM* 17 (10): 549–57. <https://doi.org/10.1145/355620.361161>.

Holzmann, Gerard. 2011. *The SPIN Model Checker: Primer and Reference
Manual*. 1st ed. Addison-Wesley Professional.

Kripke, Saul A. 1963. “Semantical Considerations on Modal Logic.” *Acta
Philosophica Fennica* 16: 83–94.

Lamport, Leslie. 1978. “Time, Clocks, and the Ordering of Events in a
Distributed System.” *Comm. Of the ACM* 21 (7): 558–65.

———. 1998. “The Part-Time Parliament.” *Tocs* 16 (2): 133–69.

———. 2002. *Specifying Systems: The TLA+ Language and Tools for Hardware
and Software Engineers*. USA: Addison-Wesley Longman Publishing Co.,
Inc.

———. 2009. “The PlusCal Algorithm Language.” In *Theoretical Aspects of
Computing - ICTAC 2009*, edited by Martin Leucker and Carroll Morgan,
36–60. Berlin, Heidelberg: Springer Berlin Heidelberg.

Lampson, Butler W., and David D. Redell. 1980. “Experience with
Processes and Monitors in Mesa.” *Commun. ACM* 23 (2): 105–17.
<https://doi.org/10.1145/358818.358824>.

Lipton, Richard J. 1975. “Reduction: A Method of Proving Properties of
Parallel Programs.” *Commun. ACM* 18 (12): 717–21.
<https://doi.org/10.1145/361227.361234>.

Liu, Yanhong A., and Scott D. Stoller. 2020. “Assurance of Distributed
Algorithms and Systems: Runtime Checking of Safety and Liveness.” In
*Proceedings of the 20th International Conference on Runtime
Verification (RV 2020)*. <https://doi.org/10.1007/978-3-030-60508-7_3>.

Liu, Yanhong A., Scott D. Stoller, and Bo Lin. 2017. “From Clarity to
Efficiency for Distributed Algorithms.” *ACM Trans. Program. Lang.
Syst.* 39 (3). <https://doi.org/10.1145/2994595>.

Lowe, Gavin. 1995. “An Attack on the Needham-Schroeder Public-Key
Authentication Protocol.” *Inf. Process. Lett.* 56 (3): 131–33.
<https://doi.org/10.1016/0020-0190(95)00144-2>.

———. 1996. “Breaking and Fixing the Needham-Schroeder Public-Key
Protocol Using FDR.” In *Tools and Algorithms for the Construction and
Analysis of Systems*, edited by Tiziana Margaria and Bernhard Steffen,
147–66. Berlin, Heidelberg: Springer Berlin Heidelberg.

Michael, Ellis, Doug Woos, Thomas Anderson, Michael D. Ernst, and
Zachary Tatlock. 2019. “Teaching Rigorous Distributed Systems with
Efficient Model Checking.” In *Proceedings of the Fourteenth EuroSys
Conference 2019*. EuroSys ’19. New York, NY, USA: Association for
Computing Machinery. <https://doi.org/10.1145/3302424.3303947>.

Michael, Maged M., and Michael L. Scott. 1996. “Simple, Fast, and
Practical Non-Blocking and Blocking Concurrent Queue Algorithms.” In
*Proceedings of the 15th Annual ACM Symposium on Principles of
Distributed Computing (PODC)*.

———. 1998. “Non-Blocking Algorithms and Preemption-Safe Locking on
Multiprogrammed Shared Memory Multiprocessors.” *Journal of Parallel and
Distributed Computing* 51 (1): 1–26.

Needham, Roger M., and Michael D. Schroeder. 1978. “Using Encryption for
Authentication in Large Networks of Computers.” *Commun. ACM* 21 (12):
993–99. <https://doi.org/10.1145/359657.359659>.

Owicki, Susan S. 1975. “Axiomatic Proof Techniques for Parallel
Programs.” PhD thesis.

Peterson, Gary L. 1981. “Myths about the Mutual Exclusion Problem.”
*Information Processing Letters* 12 (3): 115–16.
https://doi.org/<https://doi.org/10.1016/0020-0190(81)90106-X>.

Renesse, Robbert van, and Fred B. Schneider. 2004. “Chain Replication
for Supporting High Throughput and Availability.” In *6th Symposium on
Operating System Design and Implementation (OSDI 2004), San Francisco,
California, USA, December 6-8, 2004*, edited by Eric A. Brewer and Peter
Chen, 91–104. USENIX Association.
<http://www.usenix.org/events/osdi04/tech/renesse.html>.

Schlichting, Richard D., and Fred B. Schneider. 1983. “Fail-Stop
Processors: An Approach to Designing Fault-Tolerant Computing Systems.”
*Tocs* 1 (3): 222–38. <https://doi.org/10.1145/357369.357371>.

Schneider, Fred B. 1990. “Implementing Fault-Tolerant Services Using the
State Machine Approach: A Tutorial.” *Compsurv* 22 (4): 299–319.

———. 1997. *On Concurrent Programming*. Berlin, Heidelberg:
Springer-Verlag.

Valmari, Antti. 1991. “Stubborn Sets for Reduced State Space
Generation.” In *Proceedings of the 10th International Conference on
Applications and Theory of Petri Nets: Advances in Petri Nets 1990*,
491–515. Berlin, Heidelberg: Springer-Verlag.
