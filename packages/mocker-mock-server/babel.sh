#!/bin/bash
set -e

rm -fr cjs

./node_modules/.bin/babel src --out-dir cjs/src
./node_modules/.bin/babel test --out-dir cjs/test --copy-files

ls -1 *.mjs | while read line; do
  ./node_modules/.bin/babel $line --out-file cjs/${line%%.mjs}.js;
done

sed -i 's/_serializr\.default/_serializr/g' cjs/**/*.js
sed -i 's#@kroonprins/mocker-shared-lib/#@kroonprins/mocker-shared-lib/cjs/#g' cjs/**/*js
sed -i 's#./test/resources/extra-template-helpers.nunjucks.mjs#./cjs/test/resources/extra-template-helpers.nunjucks.js#g' cjs/**/*.js
