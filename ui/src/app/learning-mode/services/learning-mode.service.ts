import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RecordedRequest } from '../model/learning-mode';
import { ProjectRule, Rule, Request, Response, ResponseHeader, ResponseCookie } from '../../rules/model/project-rule';

@Injectable()
export class LearningModeService {

  constructor(private _http: HttpClient) { }

  listRecordedRequests(projectName: string): Observable<RecordedRequest[]> {
    return this._http.get<RecordedRequest[]>(`http://localhost:3004/api/learning-mode/${projectName}/recorded-requests`);
  }

  retrieveRecordedRequest(projectName: string, recordedRequestId: string): Observable<RecordedRequest> {
    return this._http.get<RecordedRequest>(
      `http://localhost:3004/api/learning-mode/${projectName}/recorded-requests/${recordedRequestId}`
    );
  }

  removeRecordedRequest(projectName: string, recordedRequestId: string): Observable<RecordedRequest> {
    return this._http.delete<RecordedRequest>(
      `http://localhost:3004/api/learning-mode/${projectName}/recorded-requests/${recordedRequestId}`
    );
  }

  removeAllRecordedRequests(projectName: string): Observable<RecordedRequest> {
    return this._http.delete<RecordedRequest>(
      `http://localhost:3004/api/learning-mode/${projectName}/recorded-requests`
    );
  }

  recordedRequestToProjectRule(recordedRequest: RecordedRequest): ProjectRule {
    const request = new Request();
    request.method = recordedRequest.request.method;
    request.path = recordedRequest.request.path;

    const response = new Response();
    response.contentType = recordedRequest.response.contentType;
    response.statusCode = recordedRequest.response.statusCode;
    response.body = recordedRequest.response.body;

    const headers: ResponseHeader[] = [];
    for (const recordedRequestResponseHeader of recordedRequest.response.headers) {
      const responseHeader = new ResponseHeader();
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
