import yaml from 'js-yaml';
import memoize from 'mem';

import { Project } from './project-model';
import { ProjectsFileSerializationModel } from './project-serialization-model';
import { deserialize } from './serializr-es6-module-loader';
import { readFileAsync, globAsync } from './util';
import { RuleService } from './rule-service';
import { logger } from './logging';

const __listProjectFiles = async (projectsFileLocation = './projects/projects.yaml') => {
    logger.debug("Read and parse the projects yaml file in location %s", projectsFileLocation);
    const projectsFileContent = await readFileAsync(projectsFileLocation);
    const projectsFile = yaml.safeLoad(projectsFileContent);
    return deserialize(ProjectsFileSerializationModel, projectsFile);
};

const _listProjectFiles = memoize(__listProjectFiles);

const _getProjectFile = async (projectName) => {
    const projectFiles = await _listProjectFiles();
    logger.debug(projectFiles, "Parsed projects");
    const projectFile =  projectFiles.projects.filter((projectFile) => {
        return projectFile.name === projectName;
    });
    if(projectFile.length !== 1) {
        throw new Error(`"Project with name '${projectName}' not found (${projectFile.length})"`)
    }
    return projectFile[0];
};

const __getRules = async (projectName) => {
    const rules = [];
    const projectFile = await _getProjectFile(projectName);
    logger.debug(projectFile, "Found project file");

    for(let ruleFiles of projectFile.rules) {
        const files = await globAsync(ruleFiles);
        for(let ruleFile of files) {
            rules.push(await RuleService.readRule(ruleFile));
        }
    }
    logger.debug(rules, "Rules found for project '%s'", projectName);
    return rules;
};

const _getRules = memoize(__getRules);

const ProjectService = {
    getRules: (projectName) => {
        logger.debug("Get rules for project '%s'", projectName);
        return _getRules(projectName);
    }
}

export { ProjectService };