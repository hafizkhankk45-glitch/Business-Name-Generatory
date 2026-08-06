# DuoName — 2-Word Business Name Generator (২-শব্দের ব্রান্ড নেম জেনারেটর)

An instant 2-word business name generator with built-in Google Sheets export, AI brand evaluation, domain availability check, and 1,000+ name generator batch support.

---

## 🚀 How to Run Locally (লোকাল কম্পিউটারে চালানোর নিয়ম)

1. **Clone or download the repository:**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd <REPOSITORY_FOLDER>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 Deploying to GitHub Pages (গিটহাব পেজেস এ ফ্রি ওয়েবসাইট বানানোর নিয়ম)

This repository includes a pre-configured `.github/workflows/deploy.yml` file.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deploy"
   git push origin main
   ```

2. **Enable GitHub Pages in your Repository Settings:**
   - Go to your GitHub Repository -> **Settings** -> **Pages**.
   - Under **Build and deployment** -> **Source**, select **GitHub Actions**.
   - Your site will automatically build and publish at `https://<username>.github.io/<repository-name>/`!

---

## ⚡ Hosting with Server Features (Render / Vercel / Railway)

If you want full **Gemini AI Generator** support with server backend:
- Deploy to **Render.com** or **Railway.app** using `npm run build` and `npm start`.
- Add environment variable `GEMINI_API_KEY` in your hosting dashboard.

---

## 🛠 Features Included
- **Unlimited 2-Word Names Generator** (Algorithmic & AI hybrid engine)
- **1-Click Export to Google Sheets** (.csv download and direct paste)
- **Brand Preview Modal** with color palettes and logo inspiration
- **Domain Availability Checker** (.com, .io, .ai, .co, .app)
- **Bengali & English UI Support**
