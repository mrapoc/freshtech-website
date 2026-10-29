#!/bin/bash
# One-off setup for deploying the website to 20i from this Mac. Run it from the
# repository folder in Terminal:
#   bash scripts/setup-20i-deploy-mac.sh <ssh-host> <ssh-user> [port] [remote-root]
# Values come from the hosting control panel's SSH Access page.
# remote-root is the
# public_html path as seen after SSH login (usually public_html).
#
# Safe to re-run: it reuses the key and replaces the rest. It creates a
# dedicated deploy key (~/.ssh/freshtech_20i_deploy), pins the server's host
# key, writes ~/.config/freshtech-deploy/config.json and, once the key works,
# schedules a check of GitHub's main branch every 15 minutes while the Mac is
# awake. To stop automatic deploys:
#   launchctl bootout gui/$(id -u)/uk.fresh-tech.deploy
# To revoke the key: remove it in My20i > SSH Access.
set -euo pipefail

host="${1:?usage: setup-20i-deploy-mac.sh <ssh-host> <ssh-user> [port] [remote-root]}"
user="${2:?usage: setup-20i-deploy-mac.sh <ssh-host> <ssh-user> [port] [remote-root]}"
port="${3:-22}"
root="${4:-public_html}"

repo="$(git rev-parse --show-toplevel)"
home_dir="$HOME/Library/Application Support/freshtech-deploy"
config_dir="$HOME/.config/freshtech-deploy"
key="$HOME/.ssh/freshtech_20i_deploy"
known_hosts="$config_dir/known_hosts"
label="uk.fresh-tech.deploy"
plist="$HOME/Library/LaunchAgents/$label.plist"
log_file="$HOME/Library/Logs/freshtech-deploy.log"

fail() { echo "Setup stopped: $*" >&2; exit 1; }

[ "$(uname)" = Darwin ] || fail "this script is for macOS."
case "$root" in ''|.|./) fail "remote-root must name public_html, not the login directory." ;; esac
node_bin="$(command -v node)" || fail "Node.js is not installed (brew install node)."
node_major="$("$node_bin" -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 22 ] || fail "Node.js 22 or newer is needed (found $("$node_bin" -v)); brew upgrade node."
command -v npm >/dev/null || fail "npm is missing."
command -v php >/dev/null || fail "PHP is needed for the server tests (brew install php)."
command -v python3 >/dev/null || fail "python3 is missing (xcode-select --install)."
command -v sftp >/dev/null || fail "sftp is missing."

git -C "$repo" fetch --quiet origin main
git -C "$repo" cat-file -e origin/main:scripts/deploy-20i-local.mjs 2>/dev/null \
  || fail "main does not contain the deploy scripts yet. Merge the deploy pull request on GitHub first."

mkdir -p "$home_dir" "$config_dir" "$HOME/.ssh" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
chmod 700 "$config_dir" "$HOME/.ssh"

if [ ! -f "$key" ]; then
  ssh-keygen -q -t ed25519 -N '' -C "freshtech-website-deploy@$(hostname -s)" -f "$key"
fi
chmod 600 "$key"

ssh-keyscan -p "$port" -t ed25519,ecdsa,rsa "$host" 2>/dev/null > "$known_hosts.new" || true
[ -s "$known_hosts.new" ] || fail "could not read the host key from $host:$port. Is SSH enabled on the package?"
mv "$known_hosts.new" "$known_hosts"
echo "Pinned host key(s) for $host:"
ssh-keygen -lf "$known_hosts"

umask 077
"$node_bin" -e '
const [file, repoDir, host, port, user, root, keyFile, knownHostsFile] = process.argv.slice(1);
require("fs").writeFileSync(file, JSON.stringify({ repoDir, host, port: Number(port), user, root, keyFile, knownHostsFile }, null, 2) + "\n");
' "$config_dir/config.json" "$repo" "$host" "$port" "$user" "$root" "$key" "$known_hosts"
umask 022

# The launcher keeps a "tools" worktree on the tip of main, so the deploy logic
# that runs is always the reviewed version, then hands over to it.
cat > "$home_dir/run.sh" <<EOF
#!/bin/bash
set -euo pipefail
export PATH="$(dirname "$node_bin"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
repo="$repo"
tools="$home_dir/tools"
git -C "\$repo" fetch --quiet origin main
if [ ! -e "\$tools/.git" ]; then
  rm -rf "\$tools"
  git -C "\$repo" worktree prune
  git -C "\$repo" worktree add --quiet --detach "\$tools" origin/main
fi
git -C "\$tools" checkout --quiet --detach --force origin/main
exec node "\$tools/scripts/deploy-20i-local.mjs" "\$@"
EOF
chmod 700 "$home_dir/run.sh"

echo
echo "Deploy key (PUBLIC part; the private key stays in $key):"
cat "$key.pub"
echo

if ! printf 'ls %s/index.html\n' "$root" | sftp -q -b - -P "$port" -i "$key" -o BatchMode=yes -o StrictHostKeyChecking=yes \
     -o "UserKnownHostsFile=$known_hosts" -o ConnectTimeout=20 "$user@$host" >/dev/null 2>&1; then
  echo "The key cannot log in yet (or $root/index.html was not found)."
  echo "1. In My20i > Manage Hosting > fresh-tech.uk > SSH Access, paste the PUBLIC key above and select Add Public Key."
  echo "2. 20i can take up to 30 minutes to activate it. Then re-run this same command."
  exit 1
fi
echo "Connected to $host and found $root/index.html."

cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$home_dir/run.sh</string><string>--auto</string></array>
  <key>StartInterval</key><integer>900</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$log_file</string>
  <key>StandardErrorPath</key><string>$log_file</string>
</dict>
</plist>
EOF
launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist"

echo
echo "Automatic deploys are on: main is checked every 15 minutes while this Mac is awake."
echo "Log: $log_file"
echo "Deploy now:      npm run deploy:20i"
echo "Roll back:       npm run deploy:20i -- --commit <earlier commit on main>"
echo "First deploy, once main contains everything that is live:"
echo "                 npm run deploy:20i -- --allow-overwrite"
