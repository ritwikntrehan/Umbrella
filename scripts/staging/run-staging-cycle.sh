#!/usr/bin/env sh
set -eu

run_channel() {
  channel="$1"
  npm run "pilot:${channel}"
  npm run "pilot:${channel}:bulletin"
  npm run "pilot:${channel}:editorial"
}

run_channel "grants"
run_channel "trade"
run_channel "market-signals"
run_channel "manufacturing"
run_channel "m-and-a"

npm run umbrella-synthesis
