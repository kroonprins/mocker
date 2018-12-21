#!/bin/bash
set -e

rm -fr cjs

./node_modules/.bin/babel src --out-dir cjs/src
./node_modules/.bin/babel test --out-dir cjs/test --copy-files

ls -1 *.mjs | while read line; do
  ./node_modules/.bin/babel $line --out-file cjs/${line%%.mjs}.js;
done

sed -i 's/_serializr\.default/_serializr/g' cjs/**/*.js
sed -i 's#./test/\*\*/\*.test.mjs#./cjs/test/**/*.test.js#g' cjs/src/test-runner.js
