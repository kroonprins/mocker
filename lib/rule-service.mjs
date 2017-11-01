import yaml from 'js-yaml';

import { RuleSerializationModel } from './rule-serialization-model';
import { deserialize } from './serializr-es6-module-loader';
import { readFileAsync } from './util';
import { logger } from './logging';

const RuleService = {
    readRule: async (fileName, encoding = 'utf8') => {
        logger.debug("Read rule %s with encoding %s", fileName, encoding);
        const fileContent = await readFileAsync(fileName, encoding);
        logger.debug(fileContent, "Rule file content for %s", fileName)
        const rule = yaml.safeLoad(fileContent);
        return deserialize(RuleSerializationModel, rule);
    }
}

export { RuleService };