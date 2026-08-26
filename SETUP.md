# Setting Up This Project on a New Machine

Follow these steps in order. No coding experience needed — just copy/paste the commands shown.

## 1. Install Node.js

1. Go to [nodejs.org](https://nodejs.org).
2. Download the **LTS** version (currently v24 — the recommended button, not "Current").
3. Run the installer with all default settings (Next → Next → Install → Finish).
4. Restart your computer after installing (this ensures the command line can find it).

## 2. Install Git

1. Go to [git-scm.com](https://git-scm.com/downloads).
2. Download and run the installer for your operating system, default settings are fine.

## 3. Verify both installed correctly

Open a terminal (Command Prompt / PowerShell on Windows, Terminal on Mac) and run:

```bash
node -v
npm -v
git --version
```

Each should print a version number. If any say "not recognized" or "command not found," restart your computer and try again.

## 4. Clone the project

Pick a folder where you want the project to live (e.g. Desktop), then run:

```bash
git clone https://github.com/vchauhankukje/kukjecrm.git
cd kukjecrm
```

This downloads the full project into a new `kukjecrm` folder.

## 5. Install dependencies

Still inside that `kukjecrm` folder, run:

```bash
npm install
```

This downloads all the packages the project depends on (takes a minute or two).

## 6. Create your `.env` file

1. In the project folder, create a new file named exactly `.env` (no other extension).
2. Open `ENV_SETUP.md` (in this same folder) and fill in the values it lists, using your Supabase project's dashboard to find them.
3. Save the file.

**Never share this file or commit it to GitHub** — it's already excluded automatically via `.gitignore`.

## 7. Run the project locally to test

```bash
npm run dev
```

This starts a local test version. It'll print a URL like `http://localhost:5173` — open that in your browser to confirm everything works (try signing up as a test candidate).

Press `Ctrl+C` in the terminal to stop it when done.

## 8. Making changes live (deploying)

Once the Vercel project is linked to GitHub (a one-time setup, see project notes), any change you push to GitHub automatically updates the live site at https://kukjecrmapp.vercel.app — no manual deploy step needed:

```bash
git add -A
git commit -m "describe what you changed"
git push
```

That's it — Vercel picks up the push and redeploys automatically within a minute or two.
