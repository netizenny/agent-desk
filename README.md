# Agent Desk

A Claude Code mod that shows your subagents in a side panel while Claude works.

Each subagent gets its own card with a small pixel mascot, its name, type and model, tokens used, time spent, step count and its last two actions. Cards sit in a green "Running" group or a yellow "Finished" group. A header shows the number of subagents, their combined tokens, how many are running and the total time. The mascot bobs while its agent runs.

The mod makes no model calls, so it costs nothing to run.

## Install

In a terminal session:

```
/plugin install agent-desk --marketplace netizenny/agent-desk
```

From a shell:

```
claude plugin install agent-desk --marketplace netizenny/agent-desk
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `netizenny/agent-desk`, then Add plugin.

Answer `y` to add the marketplace, then pick the user scope to have it in every project.

## Use

The panel opens by itself when Claude starts a subagent. Run `/agent-desk` to open it again.

### Outfits

Every card has a "Wear" button under its mascot. Press it to cycle through the outfits: none, top hat, crown, cap, party hat, headphones, sunglasses, bow tie, manager, scout, reader, clipper, uploader.

The outfit you pick is remembered for that agent type, so the next agent of the same type starts in it, in any chat.

Agent types can also start in an outfit by default. The `ROLE` table near the top of `hooks/register.tsx` maps agent types to outfits. Edit it to match your own agents.

## Limits

- Costs are shown as tokens, not dollars.
- Time on a running card updates when the agent acts, not every second.
- The terminal shows a plain block mascot with no outfit. The desktop app and editor draw the full mascot.
- The mascot is original pixel art, not official Claude art.

## License

MIT
