# The system

A design system with one component contract, five style packs and three
frameworks. Read these in order before you change anything:

1. `PLAN.md`: scope and rules. The owner's prompt, kept whole.
2. `STATE.md`: what is done and what is next.
3. `AGENTS.md`: the working rules for every agent.
4. `docs/contracts/`: tokens, anatomy, manifest, style pack, frameworks.
5. `DECISIONS.md`: choices already made. Do not reopen them.

Commands: `npm run check` proves a change. `npm run gen` rewrites barrels.
`npm run build` builds tokens and packages.

Models: the lead runs as claude-fable-5-2 at medium. Every subagent runs as
claude-opus-5-5 at medium. Pass both on every subagent call.
