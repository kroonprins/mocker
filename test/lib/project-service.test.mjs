import chai from 'chai';
const expect = chai.expect;

import { ProjectService } from './../../lib/project-service';
import { config } from './../../lib/config';

// could split this up so that not all test run synchronously
const result = (async () => {
    config.projectsFileLocation = './test/projects/tests.yaml';

    let exceptionThrown = false;
    try {
        await ProjectService.getRules('testx1');
    } catch(e) {
        exceptionThrown = true;
    }
    expect(exceptionThrown).to.be.true;

    const rules_test_one_file = await ProjectService.getRules('test_one_file');
    expect(rules_test_one_file.length).to.be.equal(1);
    expect(rules_test_one_file[0].name).to.be.equal('testRule2');

    const rules_test_glob = await ProjectService.getRules('test_glob');
    expect(rules_test_glob.length).to.be.equal(3);
    expect(rules_test_glob[0].name).to.be.equal('testRule1');
    expect(rules_test_glob[1].name).to.be.equal('testRule2');
    expect(rules_test_glob[2].name).to.be.equal('testRule3');

    const rules_test_multiple_files = await ProjectService.getRules('test_multiple_files');
    expect(rules_test_multiple_files.length).to.be.equal(2);
    expect(rules_test_multiple_files[0].name).to.be.equal('testRule2');
    expect(rules_test_multiple_files[1].name).to.be.equal('testRule1');

    const rules_test_multiple_glob = await ProjectService.getRules('test_multiple_glob');
    expect(rules_test_multiple_glob.length).to.be.equal(2);
    expect(rules_test_multiple_glob[0].name).to.be.equal('testRule1');
    expect(rules_test_multiple_glob[1].name).to.be.equal('testRule2');

    const rules_test_glob_no_match = await ProjectService.getRules('test_glob_no_match');
    expect(rules_test_glob_no_match.length).to.be.equal(0);

    const rules_test_file_does_not_exist = await ProjectService.getRules('test_file_does_not_exist');
    expect(rules_test_file_does_not_exist.length).to.be.equal(0);

    const rules_test_one_file_does_not_exist = await ProjectService.getRules('test_one_file_does_not_exist');
    expect(rules_test_one_file_does_not_exist.length).to.be.equal(1);
    expect(rules_test_one_file_does_not_exist[0].name).to.be.equal('testRule2');
})();