# Publishing the website

Merging a pull request into `main` publishes the live site at https://fresh-tech.uk.
Nobody logs into 20i or uploads files by hand, and nothing depends on a particular
computer being switched on.

| Step | What happens | Where |
| --- | --- | --- |
| Propose a change | A pull request (PR) is opened, usually by a Claude session | github.com |
| Checks run | "Static site quality": unit and output contracts, the build and the full browser suite (about 20 minutes). A green tick means it is safe to merge | GitHub Actions |
| Merge the PR | `main` changes. This is the publish button | github.com or the GitHub app |
| Deploy | "Deploy to 20i": quick checks on the merged commit, production build, backup of the files about to change, upload over SFTP, live verification, automatic restore on failure | GitHub Actions |

A merged change is normally live a few minutes after merging. If the "Deploy to 20i" run
on `main` shows a red cross, open it: the error says whether nothing was uploaded, or
whether the upload was rolled back.

## How the upload works

`scripts/deploy-20i.mjs` writes over `public_html` and never deletes anything, so the
live email handler, the private configuration and the nightly proof snapshots stay as
they are. It refuses to upload if a live file was changed outside a recorded deploy,
because the upload would otherwise wipe out that change. Commit the change to `main`
first, or run the workflow by hand with "allow overwrite" ticked.

The site is not served from a Git clone (the approach used for the Triffidesu site)
because `public_html` holds files the build does not own. Uploading only the files the
build produces, with a backup and a verified result, keeps those safe.

## One-off setup (owner only)

These steps happen in My20i and GitHub settings, which a Claude session cannot reach.

1. **Make a key just for this deploy**, on any computer with a terminal:
   `ssh-keygen -t ed25519 -f freshtech_deploy -N "" -C "github-actions deploy fresh-tech.uk"`
2. **My20i > Manage Hosting > fresh-tech.uk > SSH Access:** make sure SSH is on, note the
   SSH username, and add the contents of `freshtech_deploy.pub` (the public half).
3. **GitHub > the repository > Settings > Secrets and variables > Actions:** add two
   repository secrets:
   - `TWENTYI_SSH_KEY`: the whole contents of `freshtech_deploy` (the private half).
   - `TWENTYI_SSH_USER`: the SSH username from step 2.
4. Delete both key files from the computer. Never commit a key or paste one into a chat.
5. **Turn off the old Mac schedule**, if it is still installed, so the two never deploy
   at once: `launchctl bootout gui/$(id -u)/uk.fresh-tech.deploy`.
6. **First run:** GitHub > Actions > Deploy to 20i > Run workflow, on `main`. It should
   finish green and the summary says what went live.

The workflow assumes 20i's UK SSH host (`ssh.gb.stackcp.com`, port 22, key pinned in the
workflow) and `public_html` as the remote root. If this package ever differs, set the
repository variables `TWENTYI_SSH_HOST`, `TWENTYI_SSH_PORT`, `TWENTYI_REMOTE_ROOT` and
`TWENTYI_KNOWN_HOSTS` (the pinned host key line) rather than editing the workflow.

Recommended, so the hands-off route is also a safe one: in Settings > Rules (or Branches),
require the "quality" check to pass before merging into `main`, and turn on "Allow
auto-merge". A Claude session can then switch on auto-merge when it opens a PR you have
approved, and the change publishes itself once the checks pass.

## Undo

Open the merged PR on GitHub and choose **Revert**. That opens a new PR putting things
back; merge it like any other change and it deploys the same way. Each deploy also keeps
its backup as a run artifact for 30 days. To put an earlier commit back without a revert,
run "Deploy to 20i" by hand with that commit in the "commit" box.

Because the upload never deletes, undoing a brand new page leaves its file on the server.
It is no longer linked or in the sitemap; ask for it to be removed in My20i if it matters.

## Rules

- Merging to `main` is publishing. Claude merges only when the owner asks.
- Secrets live only in GitHub Actions secrets, never in the repository.
- The Mac deploy (`scripts/deploy-20i-local.mjs`) is a manual fallback for when GitHub is
  unavailable. Keep its schedule off.
