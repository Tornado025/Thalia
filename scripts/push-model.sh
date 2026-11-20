#!/bin/zsh
# Copy a converted q8_0 model onto a USB-connected phone (debug build of Thalia),
# into the same place the in-app downloader uses: <documents>/models/<file>.
# Usage: scripts/push-model.sh models/ggml/thalia-small-q8_0.bin [device-serial]
set -e
src=$1; serial=${2:+-s $2}
[ -f "$src" ] || { echo "usage: $0 <model.bin> [device-serial]"; exit 1; }
adb=${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb
name=$(basename "$src")
eval $adb $serial push "\"$src\"" /data/local/tmp/$name
eval $adb $serial shell "run-as in.rvce.thalia mkdir -p files/models"
eval $adb $serial shell "run-as in.rvce.thalia cp /data/local/tmp/$name files/models/$name"
eval $adb $serial shell "rm /data/local/tmp/$name"
eval $adb $serial shell "run-as in.rvce.thalia ls -l files/models/"
