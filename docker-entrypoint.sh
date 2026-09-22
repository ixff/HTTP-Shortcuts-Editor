#!/bin/sh
# Fixes ownership of the JSON store when the container starts as root (the
# image default), then drops privileges to the unprivileged "node" user so
# the server never runs as root. This makes named volumes and bind mounts
# "just work" even when they were created by an earlier root-owned run.
#
# - HSE_KEEP_ROOT=1  stay root (e.g. when the host deployment expects root)
# - started as any non-root user (--user 1000:1000): this script is a no-op
set -eu

STORE_DIR=/app/server/store

if [ "$(id -u)" = "0" ]; then
    # A bind mount may not permit chown (e.g. Docker Desktop file shares);
    # ignore failures here -- the server performs its own writability probe.
    mkdir -p "$STORE_DIR" 2>/dev/null || true
    chown -R node:node "$STORE_DIR" 2>/dev/null || true
    if [ "${HSE_KEEP_ROOT:-0}" != "1" ]; then
        exec su-exec node "$@"
    fi
fi

exec "$@"
