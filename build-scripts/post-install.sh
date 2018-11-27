#!/usr/bin/env sh

if [ -d .git/hooks ]; then
  echo "Creating symbolic link for git hooks."
  rm -fr .git/hooks
  ln -fs ../.githooks/ .git/hooks;
fi
