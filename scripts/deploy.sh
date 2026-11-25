#!/usr/bin/env bash
#
# Deploy Buccanet (https://app.buccanet.com): the relay and the web app it serves.
#
# The VPS deploys what is pushed. Its buccanet account fetches main from GitHub with the
# vendor/buccanet and vendor/buccanet-relay submodules, builds the image and starts it,
# restoring the previous release if the health check fails (vps-automation,
# containers/deploy-app.sh). This script only asks it to, so a deploy needs nothing from the
# machine it is run on. On the VPS itself, the quoted command below does the same.

set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly APP_NAME='buccanet'
readonly APP_USER='buccanet'
readonly SSH_HOST="${VPS_AUTOMATION_VPS_HOST:-vps}"
readonly DEPLOY_APP='/opt/vps-automation/containers/deploy-app.sh'

# A commit that is not pushed is not deployed, so say which one will be.
report_pushed_commit() {
  local pushed
  pushed="$(git -C "${REPO_ROOT}" ls-remote origin refs/heads/main | cut -c1-7)"
  printf 'Deploying %s at origin/main %s\n' "${APP_NAME}" "${pushed}"
  if [[ "$(git -C "${REPO_ROOT}" rev-parse --short=7 HEAD)" != "${pushed}" ]]; then
    printf 'Note: the local HEAD is a different commit and is not what gets deployed.\n' >&2
  fi
}

report_pushed_commit
ssh "${SSH_HOST}" "su - ${APP_USER} -c '${DEPLOY_APP} ${APP_NAME}'"
