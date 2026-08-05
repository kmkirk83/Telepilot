const test = require('node:test');
const assert = require('node:assert/strict');
const { autocompleteRepos, parseRepoConfig, selectRepos } = require('../src/repo-config');

test('parseRepoConfig parses aliases, branches, and context', () => {
  const repos = parseRepoConfig('acme/api|api|main|Core API;acme/web|frontend|develop|Customer UI');
  assert.deepEqual(repos, [
    { fullName: 'acme/api', alias: 'api', defaultBranch: 'main', context: 'Core API' },
    { fullName: 'acme/web', alias: 'frontend', defaultBranch: 'develop', context: 'Customer UI' }
  ]);
});

test('selectRepos supports all and explicit aliases', () => {
  const repos = parseRepoConfig('acme/api|api;acme/web|web');
  assert.equal(selectRepos(repos, 'all').length, 2);
  assert.deepEqual(selectRepos(repos, 'web'), [repos[1]]);
});

test('selectRepos provides autocomplete suggestions for unknown repos', () => {
  const repos = parseRepoConfig('acme/api|api;acme/web|web');
  assert.throws(() => selectRepos(repos, 'ap'), /Did you mean: api/);
});

test('autocompleteRepos ranks prefix matches before contains matches', () => {
  const repos = parseRepoConfig('acme/api|api;acme/admin|admin;acme/capstone|cap');
  const matches = autocompleteRepos(repos, 'ap');
  assert.deepEqual(matches.map((repo) => repo.alias), ['api', 'cap']);
});
