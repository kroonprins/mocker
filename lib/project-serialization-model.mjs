import { RuleSerializationModel, LimitedDataRuleSerializationModel } from './rule-serialization-model'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model'
import { createModelSchema, primitive, list, object } from './mjs_workaround/serializr-es6-module-loader'

const ProjectsFileSerializationModel = createModelSchema(ProjectsFile, {
  projects: list(object(ProjectFile))
})

const ProjectFileSerializationModel = createModelSchema(ProjectFile, {
  name: primitive(),
  rules: list(primitive())
})

const ProjectSerializationModel = createModelSchema(Project, {
  name: primitive(),
  rules: list(object(ProjectRule))
})

const LimitedDataProjectSerializationModel = createModelSchema(Project, {
  name: primitive()
})

const ProjectRuleSerializationModel = createModelSchema(ProjectRule, {
  location: primitive(),
  rule: object(RuleSerializationModel)
})

const LimitedDataProjectRuleSerializationModel = createModelSchema(ProjectRule, {
  location: primitive(),
  rule: object(LimitedDataRuleSerializationModel)
})

export {
  ProjectsFileSerializationModel,
  ProjectFileSerializationModel,
  ProjectSerializationModel,
  LimitedDataProjectSerializationModel,
  ProjectRuleSerializationModel,
  LimitedDataProjectRuleSerializationModel
}
