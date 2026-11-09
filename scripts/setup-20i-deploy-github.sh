#!/usr/bin/env bash
# One-off setup for .github/workflows/deploy-20i.yml, so main deploys from
# GitHub and publishing no longer depends on the Mac being awake. Run it once
# from a computer with the GitHub CLI signed in (brew install gh; gh auth login):
#   bash scripts/setup-20i-deploy-github.sh <ssh-host> <ssh-user> [port] [remote-root]
# Values come from My20i > Manage Hosting > fresh-tech.uk > SSH Access.
# remote-root is the public_html path as seen after SFTP login (usually public_html).
#
# Creates a dedicated ed25519 deploy key just for GitHub (separate from the
# Mac's key, so either can be revoked alone), pins the server's host key, stores
# everything as secrets on the GitHub "production" environment (usable from
# main only), then deletes the private key locally. It prints only the PUBLIC
# key, which you add in My20i > SSH Access. To revoke: remove that key in My20i.
set -euo pipefail
host="${1:?usage: setup-20i-deploy-github.sh <ssh-host> <ssh-user> [port] [remote-root]}"
user="${2:?usage: setup-20i-deploy-github.sh <ssh-host> <ssh-user> [port] [remote-root]}"
port="${3:-22}"; root="${4:-public_html}"
repo="mrapoc/freshtech-website"
case "$root" in ''|.|./) echo "remote-root must name public_html, not the login directory." >&2; exit 1 ;; esac
command -v gh >/dev/null || { echo "The GitHub CLI is needed (brew install gh, then gh auth login)." >&2; exit 1; }
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

ssh-keygen -q -t ed25519 -N '' -C "github-actions-deploy@${repo}" -f "$work/key"
ssh-keyscan -p "$port" -t ed25519,ecdsa,rsa "$host" 2>/dev/null > "$work/known_hosts"
[ -s "$work/known_hosts" ] || { echo "Could not read the host key from $host:$port. Is SSH enabled on the package?" >&2; exit 1; }
echo "Pinned host key(s) for $host:"; ssh-keygen -lf "$work/known_hosts"

# Only main may use the environment (and so the deploy key).
gh api -X PUT "repos/$repo/environments/production" --silent --input - <<'JSON'
{"deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}}
JSON
gh api "repos/$repo/environments/production/deployment-branch-policies" --jq '.branch_policies[].name' | grep -qx main \
  || gh api -X POST "repos/$repo/environments/production/deployment-branch-policies" -f name=main -f type=branch --silent
gh secret set TWENTYI_SSH_KEY     --env production --repo "$repo" < "$work/key"
gh secret set TWENTYI_KNOWN_HOSTS --env production --repo "$repo" < "$work/known_hosts"
gh secret set TWENTYI_SFTP_HOST   --env production --repo "$repo" --body "$host"
gh secret set TWENTYI_SFTP_USER   --env production --repo "$repo" --body "$user"
gh secret set TWENTYI_SFTP_PORT   --env production --repo "$repo" --body "$port"
gh secret set TWENTYI_REMOTE_ROOT --env production --repo "$repo" --body "$root"

echo
echo "1. Add this PUBLIC key in My20i > SSH Access (the private key has been deleted):"
cat "$work/key.pub"
echo
echo "2. Turn off the Mac's scheduled deploy so the two never race:"
echo "   launchctl bootout gui/\$(id -u)/uk.fresh-tech.deploy"
echo
echo "3. Test it: GitHub > Actions > Deploy to 20i > Run workflow (on main)."
