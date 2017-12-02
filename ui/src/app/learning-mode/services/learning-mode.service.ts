import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RecordedRequest } from '../model/learning-mode';

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

}
