const { selectRepos } = require('./repo-config');

function buildPrompt({ prompt, context, repo }) {
  const sections = [
    repo ? `Repository: ${repo.fullName}` : '',
    repo && repo.defaultBranch ? `Default branch: ${repo.defaultBranch}` : '',
    repo && repo.context ? `Repository context: ${repo.context}` : '',
    context ? `User context: ${context}` : '',
    `Prompt: ${prompt}`
  ].filter(Boolean);

  return sections.join('\n\n');
}

async function orchestrateRepos({ repos, repoSelector, prompt, context, requestRepoCompletion }) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Prompt is required for orchestration.');
  }

  const selectedRepos = selectRepos(repos, repoSelector);
  const responses = await Promise.all(
    selectedRepos.map(async (repo) => {
      const fullPrompt = buildPrompt({ prompt, context, repo });
      const response = await requestRepoCompletion({ repo, prompt: fullPrompt });
      return {
        repo: repo.fullName,
        alias: repo.alias,
        response: String(response || '').trim() || '(no response)'
      };
    })
  );

  return responses;
}

function formatAggregatedResponse(results) {
  return results
    .map((result) => `## ${result.alias} (${result.repo})\n${result.response}`)
    .join('\n\n');
}

module.exports = {
  buildPrompt,
  formatAggregatedResponse,
  orchestrateRepos
};
