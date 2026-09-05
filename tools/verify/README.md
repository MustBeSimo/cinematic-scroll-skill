# verify-build

Run from the output project's directory. Paths resolve from the caller, including
absolute paths and spaces. Skill contract checks run against the installed skill.

```bash
node /path/to/skill/tools/verify/verify-build.mjs ./index.html
node /path/to/skill/tools/verify/verify-build.mjs ./index.html --phase polish
node /path/to/skill/tools/verify/verify-build.mjs http://localhost:3000 --mode-b . --phase polish
```

| Check | When | Evidence |
|---|---|---|
| Tokens, themes, links | Always | Bundled contract integrity |
| Doctor | HTML file or directory with index.html | Static source heuristic; default minimum 80, polish 85 |
| Page-proof matrix | `--runtime` or `--phase polish` | Desktop, mobile, reduced motion on both, and no-JS screenshots/errors |
| Project typecheck/build | `--mode-b <directory>` | Runs that project's npm scripts; supports workspace dependency resolution |

URL targets are browser targets, not static source files. For application projects,
provide their running URL and project directory; the verifier does not start a server.
A missing typecheck/build script is reported as a failed command, not silently ignored.

Exit **0** is PASS for all requested checks. Exit **1** is FAIL. Exit **2** is
INCOMPLETE (a requested browser check could not run or `--fast` omitted checks),
or invalid arguments. `--strict` maps incomplete evidence to exit 1 for older CI
integrations. `--fast` alone runs static checks; `--fast --phase polish` can never
certify a build.

`--min 0..100` sets the doctor threshold. `--browser <path>` chooses Chrome.
`--json` prints the report; `--report <path>` also saves it. Browser evidence lands
in the caller's `.verify/proof/`. A report records each failure and skipped check.
Both runtime and Mode B failures are required failures when requested.

Install `playwright-core` in the skill's package (`npm install`) and provide
Chrome/Chromium to run browser checks. Dependency or browser failure is missing
evidence, not success. See [page-proof](../page-proof/README.md) for extra sample
depths and the limits of automated checks. Open the screenshots before claiming
visual quality; the verifier is not a substitute for composition review.

TasteHQ brand scoring is a separate optional gate with its own 0–1 fidelity
threshold: [contract and commands](../../references/tastehq.md).
