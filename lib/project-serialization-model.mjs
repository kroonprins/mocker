import { Rule } from './rule-model';
import { ProjectsFile, ProjectFile, Project } from './project-model';
import { createModelSchema, primitive, list, object } from './serializr-es6-module-loader';

const ProjectsFileSerializationModel = createModelSchema(ProjectsFile, {
    projects: list(object(ProjectFile))
});

const ProjectFileSerializationModel = createModelSchema(ProjectFile, {
    name: primitive(),
    rules: list(primitive())
});

// (not used)
const ProjectSerializationModel = createModelSchema(Project, {
    name: primitive(),
    rules: list(object(Rule))
});

export { ProjectsFileSerializationModel, ProjectFileSerializationModel, ProjectSerializationModel };