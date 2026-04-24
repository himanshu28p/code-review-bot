const { execSync } = require("child_process");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const PR_NUMBER = parseInt(process.env.PR_NUMBER, 10);
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const REVIEWABLE_EXTENSIONS = [
  ".js", ".ts", ".py", ".rb",
  ".go", ".java", ".php", ".cs",
  ".cpp", ".c", ".sh", ".sql",
];

const MAX_DIFF_CHARS = 20000;

function getDiff() {
  try {
    return execSync(`git diff ${BASE_SHA} ${HEAD_SHA}`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    console.error("Failed to get diff:", err.message);
    process.exit(1);
  }
}

function filterDiff(rawDiff) {
  const blocks = rawDiff.split(/(?=^diff --git)/m);
  const filtered = blocks
    .filter((block) => REVIEWABLE_EXTENSIONS.some((ext) => block.includes(ext)))
    .join("\n");

  return filtered.length > MAX_DIFF_CHARS
    ? filtered.slice(0, MAX_DIFF_CHARS) + "\n\n[... diff truncated ...]"
    : filtered;
}

async function reviewWithGemini(diff) {
  const prompt = `You are a senior software engineer doing a security-focused code review for a junior developer.

Review this git diff and identify:
1. Security vulnerabilities (SQL injection, XSS, hardcoded secrets, command injection)
2. Critical bugs (null errors, unhandled exceptions)
3. Bad practices (eval with user input, dangerouslySetInnerHTML)
4. Accidentally committed secrets (API keys, passwords, tokens)

Format your response in Markdown:
## Summary (Risk level: LOW / MEDIUM / HIGH / CRITICAL)
## Security Issues (use 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low)
## Bugs & Logic Errors
## Quick Suggestions
## Verdict: ✅ Approve / ⚠️ Request Changes / ❌ Block

Here is the diff to review:
\`\`\`diff
${diff}
\`\`\``;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function postReviewComment(reviewText) {
  const body = `## 🤖 AI Security Code Review\n\n${reviewText}\n\n---\n*Powered by Google Gemini (free)*`;

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${PR_NUMBER}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API error: ${response.status} — ${err}`);
  }

  console.log("Review posted to PR #" + PR_NUMBER);
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set!");
    process.exit(1);
  }

  console.log("Reviewing PR #" + PR_NUMBER);

  const rawDiff = getDiff();
  if (!rawDiff.trim()) { console.log("No diff found."); return; }

  const diff = filterDiff(rawDiff);
  if (!diff.trim()) { console.log("No reviewable files."); return; }

  console.log("Sending to Gemini...");
  const review = await reviewWithGemini(diff);
  console.log("\n── Review ──\n" + review);

  await postReviewComment(review);
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });