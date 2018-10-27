#!/usr/bin/env sh

if [ -d .git/hooks ]; then
  echo "Creating symbolic link for git hooks."
  rm -fr .git/hooks
  ln -fs ../.githooks/ .git/hooks;
fi;

mkdir -p ./lib/mjs_workaround

if [ -f ./node_modules/serializr/lib/es/serializr.js ]; then
  echo "Creating symbolic link for serializr (1)."
  ln -f ./node_modules/serializr/lib/es/serializr.js lib/mjs_workaround/serializr-es6-module-loader.mjs;
fi
if [ -f ../../serializr/lib/es/serializr.js ]; then
  echo "Creating symbolic link for serializr (2)."
  ln -f ../../serializr/lib/es/serializr.js lib/mjs_workaround/serializr-es6-module-loader.mjs;
fi;

cd ./ui && npm install && npm run build-prod
