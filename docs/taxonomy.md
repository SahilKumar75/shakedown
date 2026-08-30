# The defect taxonomy

Twelve failure classes, each one a way a benchmark task bundle gets rejected. For every class this file records what it is, why a review pipeline cares, how a bundle comes to have it, and what counts as proof that it is present.

The last point is the one that matters most. A review tool that asserts a defect without demonstrating it is guessing, and a guess costs the author the same cycle the tool was meant to save. So each class below names the experiment that turns a suspicion into evidence.

## oracle fails

The shipped reference solution does not earn full reward.

Reviewers put this first because it ends a run before anything expensive begins. It usually arrives through drift: the expectations move, or the reference is edited to fix one case and quietly breaks another.

**Proof.** Run the reference through the verifier and read the reward. There is nothing to infer.

## nop passes

A submission that does nothing earns reward.

This means the verifier is not testing the work. It happens when a check asserts on something present by construction, such as a file the harness itself creates, rather than on what the candidate produced.

**Proof.** Run a candidate that exits immediately and read the reward.

## answer leak

Material the solver can read contains values that only the graded expectations should hold.

The usual cause is convenience. A sample is generated from the same structure as the graded cases and copied into the visible tree, or an expectation file is left where the image can reach it. The task still looks hard while being solvable by copying.

**Proof.** Compare the values in the graded expectations against the values in every file the solver can read, and report the overlap with both paths named.

## hardcodable

The graded cases are narrow enough that a submission can satisfy them without solving the problem.

An author sees the reference pass and stops. The question they did not ask is whether anything would have failed, which is a different question and a harder one.

**Proof.** Edit the reference so it answers differently, then run it. If the edit changes an answer on a real input and the verifier still awards full reward, a gap is demonstrated. The behavioural step is essential: an edit that changes nothing proves nothing, and reporting it is how a tool earns a reputation for crying wolf.

## weak verifier

The verifier accepts a submission that does not satisfy the stated task.

Distinct from the class above because the gap is in what is asserted rather than in how much is covered. Grading a candidate against itself is the common shape, since consistency is not correctness.

**Proof.** Build the submission the description forbids and show it scoring full reward.

## nondeterministic

The same submission scores differently on two identical runs.

Randomness in the graded path is the cause, and it is often deliberate, added to stop a submission from being fitted to fixed cases. Unseeded, it makes the score a coin flip and the review unrepeatable.

**Proof.** Run the same submission twice and compare, and separately read the graded path for entropy sources that cannot be seeded.

## graceless failure

A failing candidate does not cause a zero to be recorded.

The verifier raises before it writes anything, so a genuine failure and a broken harness are indistinguishable. Reviewers treat this as serious because it corrupts every other signal.

**Proof.** Run a candidate that raises on start up and check whether a reward was recorded and the process exited cleanly.

## path escape

A graded output path can be redirected outside the directory the harness controls.

A link left where a file is expected is enough. The verifier follows it, reads bytes the submission placed elsewhere, and grades them.

**Proof.** Write the answer outside the case directory, leave a link behind, and show the verifier still awarding reward. Guard against the whole family rather than one member: reject a link anywhere along the path, require the resolved path to stay inside the directory, and require every entry to be an ordinary file or directory, because a device node or a pipe is neither and slips through checks that only ask which of the two it is.

## forbidden wording

The instruction describes the harness run clock or the scoring mechanics.

Authors add it kindly, to help the solver budget its effort. The gate rejects it because the instruction is meant to describe the deliverable rather than the machinery that grades it, and because such sentences date badly when the machinery changes.

**Proof.** Match the instruction text against the phrasings that describe elapsed time or reward, and quote the offending line.

## undetermined rule

The decisive rule cannot be worked out from anything the solver can see.

This is the subtlest class and the one no fixed experiment can settle. The author knows the rule, the verifier enforces it, and the shipped material never states or demonstrates it, so a careful solver derives a defensible answer and is marked wrong. It is also the class most likely to be argued over, because the author genuinely believes the rule is implied.

**Proof.** Judgement, informed by reading the visible material as a solver would and asking whether a second reasonable reading exists. This is where a deterministic probe reaches its limit.

## unwitnessed encoding

The graded cases use an encoding or a value class that the shipped material never shows.

A generator emits floats, or negative numbers, or an empty container, while every shipped example holds only short positive integers. A solver reverse engineers the format correctly from what it was given and then meets a case it has no way to have anticipated.

**Proof.** Enumerate the encodings the graded cases can produce and the encodings the shipped material actually exhibits, and report the difference.

## slow oracle

The reference does not finish inside the budget it declares.

Local hardware hides this. A review machine is often slower, so a reference that finishes comfortably on a laptop can miss its window in the pipeline and fail before any probe spends money.

**Proof.** Time the reference and compare against the declared budget, reporting the measurement rather than a verdict, since the margin is what the author needs to decide.

## How the classes relate

Three of them, oracle fails, nop passes and slow oracle, are visible from two runs and nothing more. They are the ones a careful author already catches by hand, which is why the baseline in this project performs exactly that check and reaches exactly those classes.

Five more, answer leak, hardcodable, nondeterministic, graceless failure and path escape, need an experiment designed for them. Each has a fixed shape, so each can be probed mechanically, and that is where the measured gain over the baseline comes from.

The remaining ones, weak verifier, undetermined rule and unwitnessed encoding, need a reading of the bundle rather than a fixed experiment. They are the residue, and they are the honest boundary of what deterministic probing can reach.
