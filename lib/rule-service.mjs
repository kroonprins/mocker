import yaml from 'js-yaml';

import { RuleSerializationModel } from './rule-serialization-model';
import { deserialize } from './serializr-es6-module-loader';
import { readFileAsync } from './util';

const RuleService = {
    readRule: async (fileName, encoding = 'utf8') => {
        const fileContent = await readFileAsync(fileName, encoding);
        const rule = yaml.safeLoad(fileContent);
        return deserialize(RuleSerializationModel, rule);
    }
}

export { RuleService };