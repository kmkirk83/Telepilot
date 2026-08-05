const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRepoConfig } = require('../src/repo-config');
const { buildPrompt, formatAggregatedResponse, orchestrateRepos } = require('../src/orchestrator');

test('buildPrompt includes repo and user context', () => {
  const [repo] = parseRepoConfig('acme/api|api|main|Core API');
  const prompt = buildPrompt({ prompt: 'Summarize status', context: 'Only mention blockers', repo });
  assert.match(prompt, /Repository: acme\/api/);
  assert.match(prompt, /Repository context: Core API/);
  assert.match(prompt, /User context: Only mention blockers/);
});

test('orchestrateRepos fans out to each selected repo', async () => {
  const repos = parseRepoConfig('acme/api|api;acme/web|web');
  const seen = [];
  const results = await orchestrateRepos({
    repos,
    repoSelector: 'all',
    prompt: 'Health?',
    context: '',
    requestRepoCompletion: async ({ repo, prompt }) => {
      seen.push({ repo: repo.alias, prompt });
      return `${repo.alias}:${prompt.length}`;
    }
  });

  assert.equal(results.length, 2);
  assert.deepEqual(seen.map((entry) => entry.repo), ['api', 'web']);
});

test('formatAggregatedResponse renders markdown sections', () => {
  const output = formatAggregatedResponse([
    { alias: 'api', repo: 'acme/api', response: 'ok' },
    { alias: 'web', repo: 'acme/web', response: 'ready' }
  ]);

  assert.match(output, /## api \(acme\/api\)/);
  assert.match(output, /## web \(acme\/web\)/);
});
