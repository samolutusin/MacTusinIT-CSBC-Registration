# Course Registration Website

A fast, mobile-friendly online course registration website for **GitHub Pages**.
It sends registrations to a **Google Apps Script** web app, which saves them in **Google Sheets** and emails the applicant and the administrator.

- Plain HTML, CSS and JavaScript — no build step, no frameworks
- No passwords, API keys or admin email in this repository (they live only inside Google Apps Script)

## Files

| File | Purpose |
|---|---|
| `index.html` | Registration page and success page |
| `css/style.css` | Design (brand colours at the top) |
| `js/config.js` | **Your settings** — course, contact, links, Apps Script URL |
| `js/countries.js` | Country drop-down list |
| `js/script.js` | Form logic and validation |
| `assets/logo.svg` | Logo (replace with your own, e.g. `assets/logo.png`, and update `LOGO` in `js/config.js`) |
| `assets/training-hero.jpg` | Hero photo (replace with your own JPG of the same name if you like) |

## Quick start

1. Edit **`js/config.js`** — set your real course name and replace the `YOUR_…` placeholders. Unset details stay hidden in preview mode.
2. Paste your Apps Script Web App URL into `APPS_SCRIPT_URL`.
3. Enable **Settings → Pages → Deploy from a branch → main / (root)**.
4. Your site appears at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

The complete step-by-step guide (Google Sheet, Apps Script, emails, testing, troubleshooting) is in the main project guide.

> ⚠ This repository is public. Never put your administrator email, Google Sheet ID, passwords or API keys in any file here.
