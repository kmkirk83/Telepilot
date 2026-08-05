const fs = require('fs');
const path = require('path');
const { parseRepoConfig, autocompleteRepos } = require('./repo-config');
const { orchestrateRepos, formatAggregatedResponse } = require('./orchestrator');

async function requestRepoCompletion({ repo, prompt }) {
  return `Stubbed response for ${repo.fullName}: ${prompt}`;
}

async function run() {
  const prompt = process.env.PROMPT || '';
  const context = process.env.CONTEXT || '';
  const repoConfig = process.env.REPO_CONFIG || '';
  const repoSelector = process.env.TARGET_REPOS || 'all';
  const autocompleteQuery = process.env.REPO_AUTOCOMPLETE_QUERY || '';
  const outputPath = process.env.GITHUB_OUTPUT;

  const repos = parseRepoConfig(repoConfig);

  if (autocompleteQuery) {
    const matches = autocompleteRepos(repos, autocompleteQuery);
    const payload = JSON.stringify(matches);
    if (outputPath) {
      fs.appendFileSync(outputPath, `autocomplete<<EOF\n${payload}\nEOF\n`);
    }
    process.stdout.write(`${payload}\n`);
    return;
  }

  const results = await orchestrateRepos({
    repos,
    repoSelector,
    prompt,
    context,
    requestRepoCompletion
  });

  const response = formatAggregatedResponse(results);
  if (outputPath) {
    fs.appendFileSync(outputPath, `response<<EOF\n${response}\nEOF\n`);
  }
  process.stdout.write(`${response}\n`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
