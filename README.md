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
