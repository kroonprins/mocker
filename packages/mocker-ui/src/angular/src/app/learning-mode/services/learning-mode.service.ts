import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RecordedRequest } from '../model/learning-mode';
import { ProjectRule, Rule, Request, Response } from '../../rules/model/project-rule';
import { ResponseCookie } from '../../shared/model/cookie';
import { NameValuePair } from '../../shared/model/name-value-pair';
import { AppConfigurationService } from '../../shared/services/app-configuration.service';
import { FixedLatency } from '../../shared/model/latency';

@Injectable()
export class LearningModeService {

  private apiServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.apiServerLocation = this.appConfigurationService.retrieveApiServerLocation();
  }

  listRecordedRequests(projectName: string): Observable<RecordedRequest[]> {
    return this._http.get<RecordedRequest[]>(
      `${this.apiServerLocation}/api/learning-mode/${projectName}/recorded-requests?sort=-timestamp`
    );
  }

  retrieveRecordedRequest(projectName: string, recordedRequestId: string): Observable<RecordedRequest> {
    return this._http.get<RecordedRequest>(
      `${this.apiServerLocation}/api/learning-mode/${projectName}/recorded-requests/${recordedRequestId}`
    );
  }

  removeRecordedRequest(projectName: string, recordedRequestId: string): Observable<RecordedRequest> {
    return this._http.delete<RecordedRequest>(
      `${this.apiServerLocation}/api/learning-mode/${projectName}/recorded-requests/${recordedRequestId}`
    );
  }

  removeAllRecordedRequests(projectName: string): Observable<RecordedRequest> {
    return this._http.delete<RecordedRequest>(
      `${this.apiServerLocation}/api/learning-mode/${projectName}/recorded-requests`
    );
  }

  recordedRequestToProjectRule(recordedRequest: RecordedRequest): ProjectRule {
    const request = new Request();
    request.method = recordedRequest.request.method;
    request.path = recordedRequest.request.path;

    const response = new Response();
    response.contentType = recordedRequest.response.contentType;
    response.statusCode = recordedRequest.response.statusCode;
    response.fixedLatency = new FixedLatency();
    response.fixedLatency.value = recordedRequest.response.latency;
    response.body = recordedRequest.response.body;

    const headers: NameValuePair[] = [];
    for (const recordedRequestResponseHeader of recordedRequest.response.headers) {
      const responseHeader = new NameValuePair();
      responseHeader.name = recordedRequestResponseHeader.name;
      responseHeader.value = recordedRequestResponseHeader.value;
      headers.push(responseHeader);
    }
    response.headers = headers;

    const cookies: ResponseCookie[] = [];
    for (const recordedRequestResponseCookie of recordedRequest.response.cookies) {
      const responseCookie = new ResponseCookie();
      responseCookie.name = recordedRequestResponseCookie.name;
      responseCookie.value = recordedRequestResponseCookie.value;
      responseCookie.properties = recordedRequestResponseCookie.properties;
      headers.push(responseCookie);
    }
    response.cookies = cookies;

    const rule = new Rule();
    rule.request = request;
    rule.response = response;

    const projectRule = new ProjectRule();
    projectRule.rule = rule;
    return projectRule;
  }

}
