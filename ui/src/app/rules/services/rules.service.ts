import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ProjectRule } from '../model/project-rule';


@Injectable()
export class RulesService {

  constructor(private _http: HttpClient) { }

  listProjectRules(projectName: string): Observable<ProjectRule[]> {
    return this._http.get<ProjectRule[]>(`http://localhost:3004/api/projects/${projectName}/rules`);
  }

  retrieveProjectRule(projectName: string, ruleName: string): Observable<ProjectRule> {
    return this._http.get<ProjectRule>(`http://localhost:3004/api/projects/${projectName}/rules/${ruleName}`);
  }

  createProjectRule(projectName: string, projectRule: ProjectRule): Observable<ProjectRule> {
    return this._http.post<ProjectRule>(`http://localhost:3004/api/projects/${projectName}/rules`, projectRule);
  }

  removeProjectRule(projectName: string, projectRule: ProjectRule): Observable<ProjectRule> {
    return this._http.delete<ProjectRule>(`http://localhost:3004/api/projects/${projectName}/rules/${projectRule.rule.name}`);
  }

  updateProjectRule(projectName: string, ruleName: string, updatedProjectRule: ProjectRule): Observable<ProjectRule> {
    return this._http.put<ProjectRule>(`http://localhost:3004/api/projects/${projectName}/rules/${ruleName}`, updatedProjectRule);
  }

  listHttpMethods (): Observable<string[]> {
    return this._http.get<string[]>(`http://localhost:3004/api/config/http-methods`);
  }

  listTemplatingTypes (): Observable<string[]> {
    return this._http.get<string[]>(`http://localhost:3004/api/config/templating-types`);
  }
}
