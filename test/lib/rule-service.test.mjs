import chai from 'chai';
const expect = chai.expect;

import { RuleService } from './../../lib/rule-service';

// could split this up so that not all test run synchronously
const result = (async () => {

    let exceptionThrownBecauseFileDoesNotExist = false;
    try {
        await RuleService.readRule('nope');
    } catch(e) {
        expect(e.message).to.be.equal('ENOENT: no such file or directory, open \'nope\'');
        exceptionThrownBecauseFileDoesNotExist = true;
    }
    expect(exceptionThrownBecauseFileDoesNotExist).to.be.true;

    let exceptionThrownBecauseFileContentIncorrect = false;
    try {
        await RuleService.readRule('./test/rules/test_incorrect_yaml.yoml');
    } catch(e) {
        expect(e.message).to.be.equal("The rule ./test/rules/test_incorrect_yaml.yoml seems to have an incorrect format");
        exceptionThrownBecauseFileContentIncorrect = true;
    }
    expect(exceptionThrownBecauseFileContentIncorrect).to.be.true;

    const rule = await RuleService.readRule('./test/rules/test_rule_2.yaml');
    expect(rule.name).to.be.equal('testRule2');
    expect(rule.request.path).to.be.equal('/hello2');
    expect(rule.request.method).to.be.equal('put');
    expect(rule.response.templatingEngine).to.be.equal('nunjucks');
})();