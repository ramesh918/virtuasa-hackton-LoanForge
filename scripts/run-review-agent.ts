import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * Programmatically invokes the `reviewer` agent (.claude/agents/reviewer.md) against a feature
 * branch, using the Claude Agent SDK directly rather than the interactive CLI — the mechanism the
 * `/review-merge` slash command and docs/prompts/review-merge.md describe as a manual workflow.
 *
 * Usage: npm run review-agent -- feature/eligibility [base]
 * Requires ANTHROPIC_API_KEY in the environment and network access to the Claude API — neither is
 * available in the sandbox this was authored in, so this was verified by confirming the SDK import
 * resolves and `query()`'s real signature/Options shape (checked against the installed
 * @anthropic-ai/claude-agent-sdk type definitions) is used correctly, not by a live model response.
 */

const branch = process.argv[2];
const base = process.argv[3] ?? 'feature-1';

if (!branch) {
  console.error('Usage: run-review-agent.ts <branch> [base]');
  process.exit(1);
}

async function main() {
  const prompt = `Use docs/prompts/review-merge.md on ${branch} against ${base}.`;

  const result = query({
    prompt,
    options: {
      cwd: process.cwd(),
      agent: 'reviewer',
      // The reviewer reports pass/fail with evidence — it must never merge or edit anything itself.
      permissionMode: 'plan',
      maxTurns: 20,
    },
  });

  for await (const message of result) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text') {
          process.stdout.write(block.text);
        }
      }
    }
    if (message.type === 'result') {
      console.log(`\n\n--- ${message.subtype} (${message.num_turns} turns) ---`);
      if (message.subtype === 'success') {
        console.log(message.result);
      }
    }
  }
}

main().catch((err) => {
  console.error('run-review-agent failed:', err);
  process.exit(1);
});
