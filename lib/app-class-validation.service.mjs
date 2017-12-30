import { JsonSchemaBasedClassValidationService } from './class-validation.service'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model'
import { ProjectsFileValidationModel, ProjectFileValidationModel, ProjectRuleValidationModel, ProjectValidationModel } from './project-validation-model'
import { Request, Header, Cookie, Response, Rule } from './rule-model'
import { RequestValidationModel, HeaderValidationModel, CookieValidationModel, ResponseValidationModel, RuleValidationModel } from './rule-validation-model'
import { Server, MockServer, LearningModeServer } from './server-model'
import { ServerValidationModel, MockServerValidationModel, LearningModeServerValidationModel } from './server-validation-model'
import { Logger } from './logging'
import { config } from './config'

/**
 * {@link JsonSchemaBasedClassValidationService} initialized with all models used in the app.
 *
 * @extends {JsonSchemaBasedClassValidationService}
 */
class AppClassValidationService extends JsonSchemaBasedClassValidationService {
  constructor () {
    super()
    this.logger = config.getClassInstance(Logger, { id: 'app.class-validation.service' })
    this
      .registerSchema(Request, RequestValidationModel)
      .registerSchema(Header, HeaderValidationModel)
      .registerSchema(Cookie, CookieValidationModel)
      .registerSchema(Response, ResponseValidationModel)
      .registerSchema(Rule, RuleValidationModel)
      .registerSchema(ProjectsFile, ProjectsFileValidationModel)
      .registerSchema(ProjectFile, ProjectFileValidationModel)
      .registerSchema(ProjectRule, ProjectRuleValidationModel)
      .registerSchema(Project, ProjectValidationModel)
      .registerSchema(Server, ServerValidationModel)
      .registerSchema(MockServer, MockServerValidationModel)
      .registerSchema(LearningModeServer, LearningModeServerValidationModel)
  }
}

export {
  AppClassValidationService
}
