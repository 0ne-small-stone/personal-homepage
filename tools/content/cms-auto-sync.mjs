import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const repository = '0ne-small-stone/personal-homepage';
const generated = /          # BEGIN GENERATED KNOWLEDGE OPTIONS[^]*?          # END GENERATED KNOWLEDGE OPTIONS/g;

export function validateChange(before, after) {
  for (const text of [before, after]) {
    if ([...text.matchAll(generated)].length !== 1) throw new Error('Candidate block must be unique');
  }
  if (before.replace(generated, '') !== after.replace(generated, '')) {
    throw new Error('Refusing changes outside the generated candidate block');
  }
}

export async function syncCandidates({ repo, ref, event, sha, before, after, api, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  if (repo !== repository || !/^refs\/heads\/codex\/(learning|content)-[a-z0-9-]+$/.test(ref) || !['push', 'workflow_dispatch'].includes(event)) {
    throw new Error('Refusing repository, branch or event outside the approved scope');
  }
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid validated source SHA');
  validateChange(before, after);
  if (before === after) return { status: 'unchanged', source: sha };
  const branch = ref.slice('refs/heads/'.length);
  const base = `/repos/${repo}`;
  const head = () => api(`${base}/git/ref/heads/${branch}`);
  if ((await head()).object.sha !== sha) return { status: 'superseded', source: sha };
  const parent = await api(`${base}/git/commits/${sha}`);
  const blob = await api(`${base}/git/blobs`, 'POST', { content: after, encoding: 'utf-8' });
  const tree = await api(`${base}/git/trees`, 'POST', {
    base_tree: parent.tree.sha,
    tree: [{ path: '.pages.yml', mode: '100644', type: 'blob', sha: blob.sha }],
  });
  const commit = await api(`${base}/git/commits`, 'POST', {
    message: `chore(cms): refresh related candidates from ${sha}`,
    tree: tree.sha, parents: [sha],
    author: { name: 'github-actions[bot]', email: '41898282+github-actions[bot]@users.noreply.github.com' },
  });
  // A simultaneous CMS save produces a sibling commit. A non-force update
  // rejects that race even when the saved file was not .pages.yml.
  try {
    await api(`${base}/git/refs/heads/${branch}`, 'PATCH', { sha: commit.sha, force: false });
  } catch (error) {
    if ([409, 422].includes(error.status) && (await head()).object.sha !== sha) {
      return { status: 'superseded', source: sha };
    }
    throw error;
  }
  // The dispatched no-change pass terminates without another commit or dispatch.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await api(`${base}/actions/workflows/site.yml/dispatches`, 'POST', { ref: branch });
      return { status: 'updated', source: sha, commit: commit.sha };
    } catch (error) {
      if (attempt === 2) throw new Error(`Candidates committed as ${commit.sha}; dispatch failed. Run site.yml manually on ${branch}.`, { cause: error });
      await sleep(1000 * (attempt + 1));
    }
  }
}

async function main() {
  const { GITHUB_REPOSITORY: repo, GITHUB_REF: ref, GITHUB_EVENT_NAME: event, GITHUB_SHA: sha, GH_TOKEN: token } = process.env;
  if (!token) throw new Error('Missing short-lived workflow token');
  const before = execFileSync('git', ['show', `${sha}:.pages.yml`], { encoding: 'utf8' });
  const after = readFileSync('.pages.yml', 'utf8');
  async function api(path, method = 'GET', body) {
    const response = await fetch(`https://api.github.com${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body && JSON.stringify(body),
    });
    if (!response.ok) {
      const error = new Error(`GitHub ${method} returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  console.log(JSON.stringify(await syncCandidates({ repo, ref, event, sha, before, after, api })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
