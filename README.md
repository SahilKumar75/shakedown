# Shakedown

A shakedown run is the trial voyage a ship makes before it enters service. You stress it on purpose so the faults surface while they are still cheap to fix.

Shakedown does that for benchmark task bundles. It rehearses an expensive automated review pipeline locally, before you submit, so the defects that pipeline would have found cost you minutes instead of hours.

## Who this is for

Task authors who write evaluation benchmarks for AI training platforms. You write a problem, an artifact, a reference solution and a verifier, then submit the bundle to a review pipeline that grades it through a sequence of automated gates.

## The bottleneck

That pipeline is slow and it is expensive. A full run takes between two and eight hours of wall clock. Probe stages spend real money on model trials, commonly over one hundred dollars per submission. A verdict at any gate ends the run, so one defect costs you the whole cycle.

The failures repeat. The same small set of defect classes accounts for most rejections, and nearly all of them are detectable locally, in seconds, by inspecting the bundle and running cheap experiments against it.

## What Shakedown does

Shakedown reads a task bundle and runs a set of specialised checking agents against it. Each agent owns one defect class, reproduces the failure the real pipeline would report, and returns a finding with the evidence attached. The report tells you what would have failed, why, and what to change.

## Status

Under construction for the micro1 Agentic Workflows Hackathon, August 2026.

## Licence

MIT. See LICENSE.
