#!/bin/bash
set -e

rm -fr cjs

./node_modules/.bin/babel src --out-dir cjs/src
./node_modules/.bin/babel test --out-dir cjs/test --copy-files

find cjs/ -name '*.js' | while read line; do
  mv "$line" "${line%%.js}.cjs"
done

ls -1 *.mjs | while read line; do
  ./node_modules/.bin/babel $line --out-file cjs/${line%%.mjs}.cjs;
done

sed -i 's/\.mjs/.cjs/g' cjs/*.cjs
sed -i 's/\.mjs/.cjs/g' cjs/**/*.cjs
sed -i 's/cjs\.js/cjs.cjs/g' cjs/**/*.cjs
sed -i 's/_serializr\.default/_serializr/g' cjs/**/*.cjs
sed -i 's#@kroonprins/mocker-shared-lib/#@kroonprins/mocker-shared-lib/cjs/#g' cjs/**/*.cjs
sed -i 's#@kroonprins/mocker-mock-server#@kroonprins/mocker-mock-server/cjs/exports.cjs#g' cjs/**/*.cjs
sed -i 's#./test/resources/extra-template-helpers.nunjucks.cjs#./cjs/test/resources/extra-template-helpers.nunjucks.cjs#g' cjs/**/*.cjs
cp types.d.ts cjs/exports.d.ts
cp cjs/exports.cjs cjs/exports.js
