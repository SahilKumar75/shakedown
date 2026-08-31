# Shakedown

A shakedown run is the trial voyage a ship makes before it enters service. You stress it on purpose so the faults surface while they are still cheap to fix.

Shakedown does that for benchmark task bundles. It rehearses an expensive automated review pipeline locally, before you submit, so the defects that pipeline would have found cost you seconds instead of hours.

## Who this is for

Task authors who write evaluation benchmarks for AI training platforms. You write a problem, an artifact, a reference solution and a verifier, then submit the bundle to a review pipeline that grades it through a sequence of automated gates.

## The bottleneck

That pipeline is slow and expensive. A full run takes hours of wall clock. Probe stages spend real money on model trials. A verdict at any gate ends the run, so one defect costs the whole cycle.

The failures repeat. A small set of defect classes accounts for most rejections, and nearly all of them are detectable locally, in seconds, by inspecting the bundle and running cheap experiments against it.

## What it does

Shakedown reads a bundle and runs a set of probes against it. Each probe owns one defect class and reproduces the failure the pipeline would report, so every finding carries evidence of something that actually happened rather than an opinion about the code.

| Probe | What it demonstrates |
| --- | --- |
| execution | The reference earns full reward, an empty submission earns none, and the reference fits its declared budget |
| leak | Values that only the graded expectations should hold are repeated in material the solver can read |
| mutation | An edit to the reference still earns full reward while answering differently on real inputs |
| determinism | The same submission scores differently on two identical runs, or the graded path draws unseedable randomness |
| resilience | A failing candidate records no zero, or a graded output path can be redirected outside the case directory |
| wording | The instruction describes the harness run clock or the scoring mechanics |

## Results

Measured on a synthetic corpus of 24 bundles, 21 carrying one planted defect each and 3 clean controls.

| Metric | Hand checks | Shakedown |
| --- | --- | --- |
| Planted defects caught | 6 of 21 | 13 of 21 |
| Share caught | 29 percent | 62 percent |
| Clean bundles wrongly held | 0 of 3 | 0 of 3 |
| Defect classes reached | 2 of 8 | 5 of 8 |
| Seconds for all 24 | 10 | 29 |

The baseline is the process an author already follows by hand: run the reference, then run an empty submission. It can only ever reveal what those two runs happen to expose, which is why it reaches two classes.

Answer leakage, nondeterminism and path escape are not yet caught. They are named here rather than hidden, and the same corpus measures whether the next round closes them.

## Running it

```
python3 corpus/generate.py corpus_out 24 7
python3 tools/emit_reports.py corpus_out site/data/reports.json
python3 tools/emit_compare.py corpus_out site/data/compare.json
```

That takes about 66 seconds end to end and costs nothing. Every probe reaches its verdict by executing the bundle rather than by asking a model, so no key, account or network call is involved. The generator is seeded, so the same seed produces the same corpus byte for byte.

To inspect a single bundle:

```
python3 -m shakedown.cli run corpus_out/ledger_merge_00
python3 -m shakedown.cli sweep corpus_out
```

## The agent layer

Six of the twelve failure classes can be settled by a fixed probe. The rest need something that can read a verifier, form an idea about how it might be cheated, write the submission that would cheat it, and run it.

```
export OPENROUTER_API_KEY=...
python3 -m shakedown.cli agent corpus_out/main/address_normalise_10 --trajectory trail.json
```

The agent is given the deterministic findings so it does not repeat them, and it is held to the same rule the probes are: it reports only what a run demonstrated. Its tools all execute the bundle, so it cannot assert a defect it has not reproduced. Every step is recorded, and `--trajectory` writes the whole thing out.

Only `instruction.md` and `env/` are shipped into the solver's image, so the agent is told that reading `solution/solve.py` is reviewing, not a leak. Without a key the command says so and exits rather than pretending to have run.

## In a pipeline

Both commands exit non zero when a bundle would be held, stream each finding to standard error as the probe reproduces it, and will write the machine readable report alongside the human one. That is enough to gate a pull request that adds or edits a task bundle.

```
python3 -m shakedown.cli run tasks/my_bundle --quiet --json shakedown.json
```

`--fail-on any` fails the build on advisory findings too, and `--fail-on never` reports without ever failing it, which is the honest setting for a first run against an existing tree.

```yaml
- name: Shake the bundle down
  run: python3 -m shakedown.cli sweep tasks --quiet --json shakedown.json
```

Nothing leaves the machine. Every probe decides by executing the bundle, so there is no key to configure and no service to call.

## Prior art

Shakedown was written for this competition. Three projects shaped it and none of their code is vendored here.

[Strix](https://github.com/usestrix/strix) makes the argument this project borrows most directly: a security finding is worth reporting only when the tool has run the code and demonstrated it, because a scanner that guesses spends the reviewer's time rather than saving it. Shakedown applies that rule to benchmark bundles, and its pipeline ergonomics, exit codes, streamed findings and a report written to disk, follow Strix's headless mode.

[Impeccable](https://github.com/pbakaus/impeccable) supplied the design review for the site. Its detector was run over the tree and the anti patterns it flagged were fixed rather than argued with.

[Agency Agents](https://github.com/msitarzewski/agency-agents) is the pattern behind writing a reviewer role as a document with its own rules and deliverables rather than as an ad hoc prompt, which is how the probe specifications in `docs/taxonomy.md` are laid out.

## The site

`site` holds a reading room for the results: the run report bundle by bundle, the comparison against the baseline, the improvement changelog and the reproduction guide. It is a static export, so it needs no backend.

```
cd site
npm install
npm run build
```

## The corpus

Every bundle is synthetic and written by `corpus/generate.py`. No material is taken from any real evaluation platform. The generator asserts that each planted defect actually manifests before it writes the labels, so the ground truth is verified rather than claimed. See `corpus/README.md`.

## Licence

MIT. See LICENSE.
