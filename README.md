🤖 AI Code Review Bot

An automated AI-powered security code reviewer that analyzes Pull Requests and detects vulnerabilities like SQL Injection, XSS, and hardcoded secrets — all within 60 seconds.

Built using Node.js, GitHub Actions, and Groq API (Llama 3.3).

🚀 Overview

This project acts like a smart assistant for your code reviews.

Whenever a developer opens a Pull Request, the bot:

Extracts only the changed code (git diff)
Sends it to an AI model for analysis
Detects security vulnerabilities
Posts a detailed review directly on the PR

No manual setup required for developers. Just open a PR and the bot does the rest.

🧠 How It Works
Developer opens a Pull Request
GitHub Actions triggers the workflow
Bot extracts changed code using git diff
Filters relevant programming files
Sends code to AI (Llama 3.3 via Groq)
AI analyzes vulnerabilities
Bot posts review comment on PR

⏱️ Entire process completes in under 60 seconds

⚙️ Tech Stack
Node.js – Core scripting logic
GitHub Actions – Automation pipeline
Groq API – AI inference platform
Llama 3 (70B) – Code analysis engine
GitHub REST API – Posting PR comments
Git Diff – Extracting code changes
🔍 Vulnerabilities Detected

The bot can identify:

🔴 SQL Injection
🟠 Cross-Site Scripting (XSS)
🔐 Hardcoded API keys & secrets
💻 Command Injection
⚠️ Insecure error handling
🔓 Missing authentication
📦 Sensitive data exposure
🧨 Unsafe use of eval()
📁 Project Structure
code-review-bot/
│
├── .github/
│   └── workflows/
│       └── code-review.yml   # GitHub Actions workflow
│
├── scripts/
│   ├── review.js             # Main bot logic
│   └── test-local.js         # Local testing script
│
├── package.json              # Dependencies & metadata
└── README.md                 # Documentation
🛠️ Setup (5 Minutes)
Clone the repository
git clone https://github.com/himanshu28p/code-review-bot.git
cd code-review-bot
Add your Groq API Key
Go to Groq Console
Generate API key
Add it in GitHub:
Settings → Secrets → Actions → New Repository Secret
Name: GROQ_API_KEY
Push code and open a Pull Request

✅ That’s it — the bot will start reviewing automatically.

💻 Local Testing
set GROQ_API_KEY=your_api_key
node scripts/test-local.js
📌 Usage
For Developers
Create a new branch
Push changes
Open a Pull Request
Wait for AI review
Fix issues → Merge
For Teams
Add collaborators
Every PR gets automatically reviewed
No workflow changes required
📈 Resume / Interview Summary

One-liner:

Built an AI-powered automated code review bot using GitHub Actions and Groq API (Llama 3) that detects security vulnerabilities in Pull Requests and posts severity-based feedback within 60 seconds.

🧩 Future Improvements
🚫 Block PR merge on critical vulnerabilities
🔔 Slack / Email alerts for high severity issues
📊 Dashboard for vulnerability analytics
🧠 Framework-specific analysis (React, Django, Spring Boot)
☁️ Support for Terraform & Kubernetes configs
🧪 Example Problem Detected
SELECT * FROM users WHERE username = '" + username + "'

⚠️ Vulnerable to SQL Injection:

' OR '1'='1

The bot detects this instantly and suggests secure alternatives.

🤝 Contributing

Contributions are welcome!

Fork the repo
Create a feature branch
Submit a PR
📜 License

MIT License

👨‍💻 Author

Himanshu Pandey
GitHub: https://github.com/himanshu28p

⭐ Support

If you found this useful, consider giving it a ⭐ on GitHub!
