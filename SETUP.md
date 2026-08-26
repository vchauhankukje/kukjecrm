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

Vercel is connected directly to this GitHub repo, so any change that reaches the `main` branch automatically updates the live site at https://kukjecrmapp.vercel.app — no manual deploy step needed.

**Important: you cannot push directly to `main`.** It's protected — every change must go through a branch and a Pull Request. This keeps the real (paid, live) app safe from untested changes, especially once more than one person is working on this project.

## 9. The branch → preview → merge workflow

Use this every time you make a change, whether it's you or another developer:

1. **Create a branch** for your change (pick a short, descriptive name):
   ```bash
   git checkout main
   git pull origin main
   git checkout -b your-name/short-description
   ```
   Example: `git checkout -b vivek/fix-signup-bug`

2. **Make your changes**, then commit and push the branch:
   ```bash
   git add -A
   git commit -m "describe what you changed"
   git push -u origin your-name/short-description
   ```

3. **Vercel automatically builds a Preview link** for that branch (separate from the live app — completely safe to test on). Find it either in the terminal output from Vercel, or on GitHub: open the branch's Pull Request page (see next step) and look for the "Vercel" bot comment with the preview URL.

4. **Open a Pull Request**: after pushing, GitHub prints a link in the terminal like `https://github.com/vchauhankukje/kukjecrm/pull/new/your-branch-name` — open it, click **Create pull request**.

5. **Test on the Preview link.** If something's wrong, keep pushing more commits to the same branch — the Preview link updates automatically each time.

6. **Merge when ready**: on the Pull Request page, click **Merge pull request** → **Confirm merge**. This is what actually updates the live site — Vercel redeploys `main` automatically within about a minute.

7. **Clean up** (optional but tidy): delete the branch after merging — GitHub offers a "Delete branch" button right after you merge.

### If two people are working at once

Each person should work on their **own branch**, never share one. If two branches touch the same lines of the same file, Git will flag a "merge conflict" when the second one tries to merge — this just means someone needs to look at both versions and manually decide what the final result should be. It's normal, not a sign anything is broken.

