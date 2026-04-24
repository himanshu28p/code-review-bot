async function testReview() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY is not set!");
    console.error("Run: set GROQ_API_KEY=your-key-here");
    process.exit(1);
  }

  const sampleDiff = [
    "diff --git a/login.js b/login.js",
    "--- a/login.js",
    "+++ b/login.js",
    "@@ -1,5 +1,10 @@",
    '+const DB_PASSWORD = "supersecret123";',
    '+const API_KEY = "sk-prod-abc123xyz";',
    " async function loginUser(req, res) {",
    "   const { username, password } = req.body;",
    '-  const query = "SELECT * FROM users WHERE username = ? AND password = ?";',
    "+  const query = `SELECT * FROM users WHERE username = '${username}'`;",
    "+  eval(req.body.userScript);",
    '+  res.send(`<h1>Welcome ${req.query.name}</h1>`);',
    " }"
  ].join("\n");

  console.log("Sending test code to Groq for review...\n");

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
            content: "You are a senior software engineer doing security-focused code reviews. Identify vulnerabilities, hardcoded secrets, SQL injection, XSS, and bad practices."
          },
          {
            role: "user",
            content: "Review this git diff:\n" + sampleDiff + "\n\nFormat your response with:\n## Summary (Risk: LOW/MEDIUM/HIGH/CRITICAL)\n## Security Issues\n## Verdict"
          }
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq API Error:", error);
    process.exit(1);
  }

  const data = await response.json();
  const review = data.choices[0].message.content;

  console.log("── Groq Review ──\n");
  console.log(review);
  console.log("\nSUCCESS! The bot is working correctly.");
}

testReview().catch(console.error);