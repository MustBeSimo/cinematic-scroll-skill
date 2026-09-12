# Verification

Evidence should match the requested output. Static source checks cannot prove a
rendered route, and a clean browser console cannot prove good composition.

## Source and build checks

- Run the project's existing format, type, test, and build commands.
- Confirm links and asset paths resolve from the deployed base path.
- Confirm the output contains semantic headings, useful alternatives, visible focus,
  and a reachable primary action.
- Confirm every animation and renderer has bounded setup and cleanup.

## Browser matrix

Inspect at least these profiles when the available browser tooling supports them:

| Profile | Main questions |
|---|---|
| Desktop | Does the sequence compose at the opening, midpoint, hold, and exit? |
| Narrow touch | Is reading order natural and every action reachable? |
| Reduced motion | Are pinning, parallax, autoplay, and loops removed? |
| Narrow + reduced motion | Is the simplified composition still complete? |
| Enhancement unavailable | Does the core story and action remain usable? |

Also test keyboard order, reverse scroll, resize, direct navigation to anchors, and
restored scroll position when the implementation uses pinned or scrubbed sequences.

## Visual review

Capture the top, the signature moment, a transition midpoint, and the closing action.
Look for collisions, unintended crops, blank regions, unreadable overlays, premature
transitions, and content hidden behind fixed elements. Inspect the actual scene when
testing an interactive control.

## Honest outcomes

- **Pass:** the requested check ran and met its stated condition.
- **Fail:** the check ran and found a problem.
- **Incomplete:** the required environment or evidence was unavailable.

Prove the signature interaction in one normal browser view before running the full
matrix. During repairs, rerun affected checks after a relevant code, dependency,
configuration or environment change, or to test a specific transient-failure
hypothesis. Do not repeat an unchanged failure or the full matrix for an isolated fix.

Distinguish output defects from missing tools or broken supplied dependencies.
Repair dependencies within the task's permitted resources, then retest. When a
required capability remains blocked after available repairs, continue independent
work and report the exact dependency and unfinished behavior. Keep failed and
incomplete checks visible. Run the full matrix at final polish once the normal
interaction works; fallback success does not prove the requested scene works.
