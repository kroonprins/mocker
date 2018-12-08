import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ProjectRule } from '../model/project-rule';
import { AppConfigurationService } from '../../shared/services/app-configuration.service';


@Injectable()
export class RulesService {

  private apiServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.apiServerLocation = this.appConfigurationService.retrieveApiServerLocation();
  }

  listProjectRules(projectName: string): Observable<ProjectRule[]> {
    return this._http.get<ProjectRule[]>(`${this.apiServerLocation}/api/projects/${projectName}/rules`);
  }

  retrieveProjectRule(projectName: string, ruleName: string): Observable<ProjectRule> {
    return this._http.get<ProjectRule>(`${this.apiServerLocation}/api/projects/${projectName}/rules/${ruleName}`)
      .map(projectRule => {
        projectRule.rule.isConditionalResponse = typeof projectRule.rule.response === 'undefined';
        return projectRule;
      });
  }

  createProjectRule(projectName: string, projectRule: ProjectRule): Observable<ProjectRule> {
    if (projectRule.rule.isConditionalResponse) {
      projectRule.rule.response = undefined;
    } else {
      projectRule.rule.conditionalResponse = undefined;
    }
    return this._http.post<ProjectRule>(`${this.apiServerLocation}/api/projects/${projectName}/rules`, projectRule);
  }

  removeProjectRule(projectName: string, projectRule: ProjectRule): Observable<ProjectRule> {
    return this._http.delete<ProjectRule>(`${this.apiServerLocation}/api/projects/${projectName}/rules/${projectRule.rule.name}`);
  }

  updateProjectRule(projectName: string, ruleName: string, updatedProjectRule: ProjectRule): Observable<ProjectRule> {
    if (updatedProjectRule.rule.isConditionalResponse) {
      updatedProjectRule.rule.response = undefined;
    } else {
      updatedProjectRule.rule.conditionalResponse = undefined;
    }
    return this._http.put<ProjectRule>(`${this.apiServerLocation}/api/projects/${projectName}/rules/${ruleName}`, updatedProjectRule);
  }
}
