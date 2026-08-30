# The Shakedown evaluation corpus

This folder holds the generator for the labelled corpus that Shakedown is measured against. Every bundle in the corpus is synthetic. Every byte of it is produced by `generate.py` in this folder. No material is taken from any real evaluation platform, no real submission is copied, adapted or paraphrased, and no bundle describes a real task from anywhere.

## What a bundle is

Each generated bundle follows the layout that `shakedown/bundle.py` loads and `shakedown/runner.py` executes.

```
<bundle_name>/
  task.toml            name, summary and the oracle budget in seconds
  instruction.md       the problem statement, visible to the solver
  env/                 input material, visible to the solver
    format_notes.md    the shape of the input and the meaning of every field
    example_input.txt  one worked example, or example_dump.bin for the binary theme
    example_output.txt the answer for that example
  solution/solve.py    the reference solution
  tests/verify.py      the verifier, with its own reference implementation inside
  tests/cases/         the graded cases, never visible to the solver
```

A candidate program is run as `python3 candidate.py input_path output_path`. The verifier is run as `python3 tests/verify.py candidate.py`. It grades the candidate on every case in `tests/cases`, compares each result against an expectation it computes itself, and prints a final `reward=1.0` or `reward=0.0` line. It prints a reward line on every path and exits zero, except in bundles where a defect was injected on purpose to break exactly that promise.

## The themes

Bundles are drawn from three themes so that the corpus is not a set of clones and so that no defect class sits on only one kind of task.

1. `ledger_merge`. Two transaction logs arrive one after the other in a single file. Merge them into one ledger, drop repeated identifiers, sort by epoch with an identifier tiebreak, and carry a running total.
2. `record_recover`. A framed binary dump with no header and no index. Every frame is a tag byte, a two byte big endian length and a payload. Rebuild the records, joining continuation frames onto the record they continue and stepping over padding frames.
3. `address_normalise`. Messy address records arrive from several sources. Normalise each field, drop the records that repeat after normalisation, and order the survivors.

Each theme has a genuine computation, a reference solution under `solution/`, a separate reference implementation inside `tests/verify.py` that is never imported from `solution/`, and generated case data.

## The labels

`labels.json` sits beside the bundle folders and is the ground truth.

```
seed            the seed the corpus was generated with
count           how many bundles were written
labels          bundle name to injected defect, or null for a clean control
bundles         bundle name to theme, defect, observed oracle reward, observed nop reward
distribution    counts by defect class and counts by theme
```

The defect names are exactly the values of the `Defect` enum in `shakedown/findings.py`. The classes the generator injects are `answer_leak`, `oracle_fails`, `nop_passes`, `hardcodable`, `nondeterministic`, `graceless_failure`, `path_escape` and `forbidden_wording`. A bundle carries at most one injected defect. A clean control carries none.

## What each injected defect does

* `answer_leak`. The expected output for a graded case is copied into `env/`, where the solver can read it.
* `oracle_fails`. The reference solution carries a real bug, so it scores below 1.0 against its own verifier.
* `nop_passes`. The verifier treats a missing output file as nothing to complain about, so an empty submission scores 1.0.
* `hardcodable`. The bundle is reduced to one graded case, so a program that ignores its input and prints that one answer passes.
* `nondeterministic`. The verifier appends graded cases built from an unseeded random source, so two runs grade different material.
* `graceless_failure`. The verifier raises on the failing path before it reaches its reward line, so a failed run records no reward at all.
* `path_escape`. The verifier resolves the candidate output path and follows it, without rejecting a symlink that points outside the case directory.
* `forbidden_wording`. The instruction gains a sentence describing the harness run clock and the scoring budget.

## Regenerating

```
python3 corpus/generate.py corpus_out/run_a 24 7
```

The three arguments are positional: the output directory, the number of bundles, and the seed. The generator refuses to write into a directory that already holds something other than a corpus it wrote itself.

Output is byte identical for the same seed. To confirm that, generate twice and compare the two trees with the comparison script in this folder, which takes two directories and nothing else.

```
python3 corpus/generate.py corpus_out/run_a 24 7
python3 corpus/generate.py corpus_out/run_b 24 7
python3 corpus/compare.py corpus_out/run_a corpus_out/run_b
```

It prints `identical` and exits zero when every file matches byte for byte, and it names the first files that differ when they do not.

## Balance

Bundles are assigned round robin over nine categories: one clean control and the eight defect classes. The theme advances with both the position in the cycle and the number of the cycle, so the bundles of any one defect class land on three different themes and no defect class is confounded with one theme. At a count of 24 the corpus holds three clean controls and two or three bundles of every defect class.

## Self verification

The generator does not merely claim its labels. After writing each bundle it loads the bundle through `shakedown.bundle` and runs it through `shakedown.runner`, then checks the label it just wrote.

* Every bundle other than an `oracle_fails` bundle must score oracle 1.0.
* An `oracle_fails` bundle must score below 1.0.
* Every bundle other than `nop_passes` and `graceless_failure` must score nop 0.0.
* A `nop_passes` bundle must score nop 1.0.
* A `graceless_failure` bundle must print no reward line on the failing path and must exit non zero.
* A `hardcodable` bundle must hold exactly one graded case, and a program that ignores its input and prints that single answer must score 1.0.
* A `path_escape` bundle must accept a candidate that redirects its output through a symlink pointing outside the case directory.
* A `nondeterministic` bundle must grade two different sets of material on two identical runs, which the verifier reports as a `cases_digest` line.
* An `answer_leak` bundle must carry a file under `env/` holding the exact expected output of a graded case.
* A `forbidden_wording` bundle must carry the offending sentence in `instruction.md`.

If any of those checks fails the generator stops and names the bundle. A corpus that finished writing is a corpus whose labels were observed rather than asserted.
