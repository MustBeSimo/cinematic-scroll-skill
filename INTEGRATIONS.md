# Use Web Design Studio with your agent

The same skill works across coding agents. Pick your tool below, run the command
in your project directory, then open a new agent session. The installer may ask
which skill and installation method to use; select `cinematic-scroll`.

| Agent | Install in this project |
|---|---|
| Claude Code | `npx skills add MustBeSimo/web-design-studio --agent claude-code` |
| Cursor | `npx skills add MustBeSimo/web-design-studio --agent cursor` |
| Hermes | `npx skills add MustBeSimo/web-design-studio --agent hermes-agent` |
| Kimi Code CLI | `npx skills add MustBeSimo/web-design-studio --agent kimi-code-cli` |
| Gemini CLI | `npx skills add MustBeSimo/web-design-studio --agent gemini-cli` |
| OpenClaw | `npx skills add MustBeSimo/web-design-studio --agent openclaw` |
| Other supported agents | `npx skills add MustBeSimo/web-design-studio` |

Add `--global` to install in your agent's user directory instead. The generic
command lets you choose the agent interactively. Node.js/npm is needed for `npx`.
Agent names and install flags follow the [official skills CLI documentation](https://github.com/vercel-labs/skills#supported-agents).

Then ask your agent:

> Use cinematic-scroll to build a website for my project. Match my brand,
> create one memorable interaction, and check mobile and reduced motion.

## Prefer ClawHub for OpenClaw?

```sh
npx clawhub install @mustbesimo/cinematic-scroll
```

[Browse the existing ClawHub package](https://clawhub.ai/mustbesimo/skills/cinematic-scroll).
The established repository and install name remain unchanged after the rebrand.

## Manual setup

Download or clone the full repository into a `cinematic-scroll` directory within
your agent's supported skills location. Keep `SKILL.md`, `references/`, `runtime/`
and supporting files together; copying only the Markdown entry point omits its
dependencies. For example, Hermes supports `~/.hermes/skills/`; Kimi supports the
shared `.agents/skills/` project directory.

See the official [Hermes skill guide](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/skills.md),
[Kimi skill guide](https://moonshotai.github.io/kimi-code/en/customization/skills),
[Cursor skill guide](https://cursor.com/docs/context/skills), and
[Claude Code skill guide](https://code.claude.com/docs/en/skills).
These are documented integration routes; browser checks of the installer picker
do not establish an end-to-end installation test in every agent.
