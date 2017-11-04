// Temporary workaround because it does not seem possible to use test frameworks like mocha/ava/... with modules

import util from 'util';
import glob from 'glob';

const globAsync = util.promisify(glob);

const _findTests = async () => {
    return await globAsync('./**/*.test.mjs');
}

const _runTests = async () => {
    const tests = await _findTests();

    const results = {
        run: 0,
        failed: 0
    };

    for(let test of tests) {
        results.run++;
        try {
            //import(test);
            throw new Error("Node doesn't support dynamic import yet.");
        } catch(e) {
            console.error(`Test ${test} failed`);
            console.error(e);
            results.failed++;
        }
    }

    console.log();
    console.log(`Results: ${results.run} test(s) run with ${results.failed} failed`);
}

// _runTests();


//-------------------
// horrid workaround upon the workaround :)
let count = 0;
import './lib/config.test'; count++;
import './lib/logging.test'; count++;
import './lib/project-service.test'; count++;
import './lib/rule-service.test'; count++;
import './lib/templating-service.test'; count++;
import './lib/administration-server.test'; count++;
import './lib/mock-server.test'; count++;
import './lib/learning-mode.db.service.test'; count++;
import './lib/learning-mode.service.test'; count++;
import './lib/learning-mode.reverse-proxy.test'; count++;


(async () => {
    const tests = await _findTests();
    if(tests.length !== count) {
        throw new Error(`It seems some of the test have not been added in the runner: ${tests.length} <=> ${count}`);
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});

process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error);
    process.exit(1);
});

process.on('exit', (code) => {
    if(code === 0) {
        console.log();
        console.log(`All tests passed (${count})`);
    }
});
