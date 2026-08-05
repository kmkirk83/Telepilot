const DEFAULT_MAX_REPOS = 25;

function normalizeAlias(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseRepoEntry(rawEntry, index) {
  if (!rawEntry || !String(rawEntry).trim()) {
    throw new Error(`Repository entry at index ${index} is empty.`);
  }

  const parts = String(rawEntry)
    .split("|")
    .map((part) => part.trim());

  const fullName = parts[0];
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) {
    throw new Error(`Repository entry \"${fullName}\" must use owner/name format.`);
  }

  const alias = normalizeAlias(parts[1] || fullName.split("/")[1]);
  if (!alias) {
    throw new Error(`Repository entry \"${fullName}\" produced an empty alias.`);
  }

  const defaultBranch = parts[2] || "main";
  const context = parts.slice(3).join("|");

  return { fullName, alias, defaultBranch, context };
}

function parseRepoConfig(configString, options = {}) {
  const maxRepos = options.maxRepos || DEFAULT_MAX_REPOS;
  const entries = String(configString || "")
    .split(/\r?\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length) {
    throw new Error("At least one repository must be configured.");
  }

  if (entries.length > maxRepos) {
    throw new Error(`Repository configuration exceeds limit of ${maxRepos} repositories.`);
  }

  const repos = entries.map(parseRepoEntry);
  const seen = new Set();

  for (const repo of repos) {
    const key = `${repo.fullName}:${repo.alias}`;
    if (seen.has(key) || seen.has(repo.alias)) {
      throw new Error(`Duplicate repository alias detected: ${repo.alias}`);
    }
    seen.add(key);
    seen.add(repo.alias);
  }

  return repos;
}

function buildAutocompleteIndex(repos) {
  return repos.map((repo) => ({
    value: repo.alias,
    label: `${repo.alias} (${repo.fullName})`,
    searchTerms: [repo.alias, repo.fullName, repo.defaultBranch, repo.context]
      .filter(Boolean)
      .map((term) => term.toLowerCase())
  }));
}

function autocompleteRepos(repos, query, limit = 5) {
  const normalized = normalizeAlias(query);
  if (!normalized) {
    return repos.slice(0, limit);
  }

  return buildAutocompleteIndex(repos)
    .map((entry, index) => ({
      repo: repos[index],
      score: entry.searchTerms.reduce((best, term) => {
        if (term === normalized) return Math.max(best, 100);
        if (term.startsWith(normalized)) return Math.max(best, 75);
        if (term.includes(normalized)) return Math.max(best, 50);
        return best;
      }, 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.repo.alias.localeCompare(right.repo.alias))
    .slice(0, limit)
    .map((entry) => entry.repo);
}

function selectRepos(repos, selector) {
  const raw = String(selector || "all").trim();
  if (!raw || raw === "all" || raw === "*") {
    return repos;
  }

  const requested = raw
    .split(",")
    .map((value) => normalizeAlias(value))
    .filter(Boolean);

  if (!requested.length) {
    throw new Error("Repository selector did not contain any valid repo names.");
  }

  const byAlias = new Map(repos.map((repo) => [repo.alias, repo]));
  const selected = requested.map((alias) => {
    const repo = byAlias.get(alias);
    if (!repo) {
      const suggestions = autocompleteRepos(repos, alias, 3).map((item) => item.alias);
      const suffix = suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : "";
      throw new Error(`Unknown repository selector: ${alias}.${suffix}`);
    }
    return repo;
  });

  return [...new Map(selected.map((repo) => [repo.alias, repo])).values()];
}

module.exports = {
  DEFAULT_MAX_REPOS,
  autocompleteRepos,
  buildAutocompleteIndex,
  normalizeAlias,
  parseRepoConfig,
  selectRepos
};
