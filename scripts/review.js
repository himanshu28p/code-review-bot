const { execSync } = require("child_process");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
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
    return execSync("git diff " + BASE_SHA + " " + HEAD_SHA, {
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

async function reviewWithGroq(diff) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a senior software engineer doing a security-focused code review for a junior developer. Identify security vulnerabilities, hardcoded secrets, SQL injection, XSS, bad practices, and critical bugs. Format your response with: ## Summary (Risk: LOW/MEDIUM/HIGH/CRITICAL), ## Security Issues with severity emoji, #