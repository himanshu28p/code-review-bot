const { execSync } = require("child_process");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const PR_NUMBER = parseInt(process.env.PR_NUMBER, 10);
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const REVIEWABLE_EXTENSIONS = [".js",".ts",".py",".rb",".go",".java",".php",".cs",".cpp",".c",".sh",".sql"];
const MAX_DIFF_CHARS = 20000;

function getDiff() {
  try {
    return execSync("git diff " + BASE_SHA + " " + HEAD_SHA, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    console.error("Failed to get diff:", err.message);
    process.exit(1);
  }
}

function filterDiff(rawDiff) {
  const blocks = rawDiff.split(/(?=^diff --git)/m);
  const filtered = blocks
    .filter(function(block) {
      return REVIEWABLE_EXTENSIONS.some(function(ext) {
        return block.includes(ext);
      });
    })
    .join("\n");
  if (filtered.length > MAX_DIFF_CHARS) {
    return filtered.slice(0, MAX_DIFF_CHARS) + "\n\n[... diff truncated ...]";
  }
  return filtered;
}

async function reviewWithGroq(diff) {
  const systemMsg = "You are a senior software engineer doing a security-focused code review. " +
    "Identify security vulnerabilities, hardcoded secrets, SQL injection, XSS, bad practices, and critical bugs. " +
    "Format your response with: ## Summary, ## Security Issues, ## Bugs, ## Verdict";

  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: "Review this git diff:\n" + diff }
    ],
    max_tokens: 2048,
    temperature: 0.3
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + GROQ_API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Groq API error: " + response.status + " - " + err);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function postReviewComment(reviewText) {
  const body = "## AI Security Code Review\n\n" + reviewText + "\n\n---\n*Powered by Groq + Llama 3.3 (free)*";
  const url = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/issues/" + PR_NUMBER + "/comments";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + GITHUB_TOKEN,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify({ body: body })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("GitHub API error: " + response.status + " - " + err);
  }

  console.log("Review posted to PR #" + PR_NUMBER);
}

async function main() {
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not set!");
    process.exit(1);
  }
  console.log("Reviewing PR #" + PR_NUMBER);
  const rawDiff = getDiff();
  if (!rawDiff.trim()) { console.log("No diff found."); return; }
  const diff = filterDiff(rawDiff);
  if (!diff.trim()) { console.log("No reviewable files."); return; }
  console.log("Sending to Groq...");
  const review = await reviewWithGroq(diff);
  console.log("\n-- Review --\n" + review);
  await postReviewComment(review);
}

main().catch(function(err) {
  console.error("Error:", err);
  process.exit(1);
});
