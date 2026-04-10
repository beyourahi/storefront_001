/**
 * @fileoverview Changelog Data Pipeline
 *
 * SERVER-ONLY MODULE — never import in client code or route components.
 *
 * Fetches commits from GitHub, pre-filters trivial ones, enriches with per-commit
 * stats to drop low-impact changes, then transforms meaningful commits via Claude AI
 * into plain-language entries for non-technical shoppers. Results are cached for
 * 1 hour via the Cloudflare Workers Cache API.
 *
 * Pipeline: GitHub commit list → pre-filter → stats enrichment → AI transform → cache
 *
 * Graceful degradation at every step:
 * - Missing env vars → return []
 * - GitHub API failure → return [] (or cached entries if available)
 * - AI batch failure → skip that batch, continue
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Public Types ──────────────────────────────────────────────────────────────

export type ChangelogEntry = {
    /** Sequential index string — never a raw SHA */
    id: string;
    /** ISO 8601 date string */
    date: string;
    /** AI-generated, ≤10 words */
    headline: string;
    /** AI-generated, 2–3 sentences, plain English */
    summary: string;
    category: "New Feature" | "Improvement" | "Fix" | "Maintenance";
};

// ── Pipeline Constants ────────────────────────────────────────────────────────

const CHANGELOG_CACHE_KEY = "https://internal.changelog/entries/v1";
const CHANGELOG_CACHE_NAME = "changelog";
const CACHE_TTL_SECONDS = 3600; // 1 hour
const MAX_COMMITS = 200; // up to 2 pages × 100 commits
const STATS_MIN_LINES = 20; // drop commits with fewer total line changes
const AI_BATCH_SIZE = 10; // commits per Claude API call
const STATS_BATCH_SIZE = 20; // parallel stat fetches (respects GitHub secondary rate limits)
const AI_MODEL = "claude-haiku-4-5-20251001"; // fast + cheap

// Conventional commit prefixes that are never shopper-relevant
const TRIVIAL_MESSAGE_PATTERN =
    /^(chore|ci|build|style|format|lint|deps?|bump|fix typo|fixup|revert|wip|merge|release)\b/i;

const AI_TRANSFORM_PROMPT = `You are transforming technical git commit messages into plain-language changelog entries for non-technical e-commerce shoppers.

Rules:
- Write for customers browsing a shop, not developers
- Use present-tense plain English
- NEVER include: SHA hashes, file paths, variable names, branch names, author references, technical jargon
- Return ONLY valid JSON — a single array, no preamble, no explanation, no markdown code fences
- Each element must be either:
  - null (if the commit is trivial, internal tooling, or not meaningful to shoppers)
  - {"headline": "...", "summary": "...", "category": "New Feature"|"Improvement"|"Fix"|"Maintenance"}
- headline: 5-8 words, user-benefit focused, present tense
- summary: 2-3 sentences explaining what changed and why it benefits shoppers
- Category guidance:
  - "New Feature": brand new capability shoppers can use
  - "Improvement": makes an existing experience better or faster
  - "Fix": resolves something that was not working correctly
  - "Maintenance": performance, reliability, or behind-the-scenes stability improvements`;

// ── Internal Types ────────────────────────────────────────────────────────────

type EnvLike = {
    GITHUB_API_TOKEN?: string;
    GITHUB_REPO_OWNER?: string;
    GITHUB_REPO_NAME?: string;
    ANTHROPIC_API_KEY?: string;
};

type GitHubCommit = {
    sha: string;
    commit: {
        message: string;
        author: {date: string};
    };
    parents: Array<{sha: string}>;
};

type GitHubCommitDetail = {
    stats: {total: number};
};

type AiTransformResult = {
    headline: string;
    summary: string;
    category: "New Feature" | "Improvement" | "Fix" | "Maintenance";
} | null;

// ── Cache Helpers ─────────────────────────────────────────────────────────────

async function readCache(): Promise<ChangelogEntry[] | null> {
    try {
        const cache = await caches.open(CHANGELOG_CACHE_NAME);
        const response = await cache.match(CHANGELOG_CACHE_KEY);
        if (!response) return null;
        return (await response.json()) as ChangelogEntry[];
    } catch {
        return null;
    }
}

async function writeCache(entries: ChangelogEntry[]): Promise<void> {
    try {
        const cache = await caches.open(CHANGELOG_CACHE_NAME);
        await cache.put(
            CHANGELOG_CACHE_KEY,
            new Response(JSON.stringify(entries), {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`
                }
            })
        );
    } catch {
        // Cache write is best-effort; the pipeline still returns entries
    }
}

// ── GitHub Helpers ────────────────────────────────────────────────────────────

function githubHeaders(token: string): HeadersInit {
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "storefront-changelog-pipeline/1.0"
    };
}

async function fetchCommitList(owner: string, repo: string, token: string): Promise<GitHubCommit[]> {
    const all: GitHubCommit[] = [];
    const headers = githubHeaders(token);

    for (let page = 1; page <= 2; page++) {
        const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&page=${page}&sha=HEAD`;
        const res = await fetch(url, {headers});

        if (!res.ok) break; // Rate-limited or auth error — stop paging

        const batch = (await res.json()) as GitHubCommit[];
        all.push(...batch);
        if (batch.length < 100) break; // No more pages
    }

    return all.slice(0, MAX_COMMITS);
}

async function fetchCommitDetail(
    owner: string,
    repo: string,
    sha: string,
    token: string
): Promise<GitHubCommitDetail | null> {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
            headers: githubHeaders(token)
        });
        return res.ok ? ((await res.json()) as GitHubCommitDetail) : null;
    } catch {
        return null;
    }
}

// ── AI Transform ──────────────────────────────────────────────────────────────

async function transformBatch(
    commits: Array<{message: string}>,
    anthropicKey: string
): Promise<AiTransformResult[]> {
    const client = new Anthropic({apiKey: anthropicKey});
    const n = commits.length;

    const prompt = `${AI_TRANSFORM_PROMPT}

Transform these ${n} commit messages. Return a JSON array with exactly ${n} elements:

${commits.map((c, i) => `${i + 1}. ${c.message.split("\n")[0].trim()}`).join("\n")}`;

    try {
        const response = await client.messages.create({
            model: AI_MODEL,
            max_tokens: 2048,
            messages: [{role: "user", content: prompt}]
        });

        const block = response.content[0];
        if (block.type !== "text") return Array<null>(n).fill(null);

        // Extract the JSON array from the response (ignores any accidental prose)
        const jsonMatch = block.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return Array<null>(n).fill(null);

        const parsed = JSON.parse(jsonMatch[0]) as AiTransformResult[];
        return Array.isArray(parsed) && parsed.length === n ? parsed : Array<null>(n).fill(null);
    } catch {
        return Array<null>(n).fill(null);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch and return changelog entries for display.
 *
 * Returns a clean `ChangelogEntry[]` — no raw GitHub data ever reaches the caller.
 * The pipeline is entirely server-side; `env` values are never sent to the client.
 */
export async function fetchChangelogEntries(env: EnvLike): Promise<ChangelogEntry[]> {
    const {
        GITHUB_API_TOKEN: token,
        GITHUB_REPO_OWNER: owner,
        GITHUB_REPO_NAME: repo,
        ANTHROPIC_API_KEY: anthropicKey
    } = env;

    // Graceful degradation: missing config → empty changelog
    if (!token || !owner || !repo || !anthropicKey) {
        return [];
    }

    // Serve from Workers Cache if fresh (1hr TTL)
    const cached = await readCache();
    if (cached) return cached;

    // Fetch commit list (up to 200 commits, 2 pages)
    let rawCommits: GitHubCommit[];
    try {
        rawCommits = await fetchCommitList(owner, repo, token);
    } catch {
        return []; // GitHub unreachable — return empty rather than crash
    }

    // Pre-filter: drop merge commits and trivial conventional-commit types
    const candidates = rawCommits.filter(c => {
        if (c.parents.length > 1) return false; // merge commit
        return !TRIVIAL_MESSAGE_PATTERN.test(c.commit.message.split("\n")[0].trim());
    });

    // Enrich with per-commit stats in serial batches (avoids GitHub secondary rate limits)
    const meaningful: Array<{message: string; date: string}> = [];

    for (let i = 0; i < candidates.length; i += STATS_BATCH_SIZE) {
        const chunk = candidates.slice(i, i + STATS_BATCH_SIZE);
        const details = await Promise.all(chunk.map(c => fetchCommitDetail(owner, repo, c.sha, token)));

        for (let j = 0; j < chunk.length; j++) {
            const detail = details[j];
            // Drop low-impact commits: fewer than STATS_MIN_LINES total lines changed
            if (detail && detail.stats.total >= STATS_MIN_LINES) {
                meaningful.push({
                    message: chunk[j].commit.message,
                    date: chunk[j].commit.author.date
                });
            }
        }
    }

    if (meaningful.length === 0) return [];

    // AI transform in batches — failures skip that batch, pipeline continues
    const raw: Array<{date: string; entry: AiTransformResult}> = [];

    for (let i = 0; i < meaningful.length; i += AI_BATCH_SIZE) {
        const batch = meaningful.slice(i, i + AI_BATCH_SIZE);
        try {
            const results = await transformBatch(batch, anthropicKey);
            for (let j = 0; j < batch.length; j++) {
                raw.push({date: batch[j].date, entry: results[j]});
            }
        } catch {
            // Skip failed batch — other batches still contribute entries
        }
    }

    // Filter nulls, sort by date descending, assign sequential IDs
    const entries: ChangelogEntry[] = raw
        .filter((r): r is {date: string; entry: NonNullable<AiTransformResult>} => r.entry !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((r, i) => ({
            id: String(i + 1),
            date: r.date,
            headline: r.entry.headline,
            summary: r.entry.summary,
            category: r.entry.category
        }));

    await writeCache(entries);
    return entries;
}
