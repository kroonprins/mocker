import serializr from 'serializr'
import { RuleSerializationModel, LimitedDataRuleSerializationModel } from './rule-serialization-model.mjs'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model.mjs'

const { createModelSchema, primitive, list, object } = { ...serializr }

const ProjectFileSerializationModel = createModelSchema(ProjectFile, {
  name: primitive(),
  rules: list(primitive())
})

const ProjectsFileSerializationModel = createModelSchema(ProjectsFile, {
  projects: list(object(ProjectFileSerializationModel))
})

const LimitedDataProjectSerializationModel = createModelSchema(Project, {
  name: primitive()
})

const ProjectRuleSerializationModel = createModelSchema(ProjectRule, {
  location: primitive(),
  rule: object(RuleSerializationModel)
})

const ProjectSerializationModel = createModelSchema(Project, {
  name: primitive(),
  rules: list(object(ProjectRuleSerializationModel))
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
