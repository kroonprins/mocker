import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ConfigDropdownService {

  constructor(private _http: HttpClient) { }

  retrieveConfigItem (configItem: string): Observable<string[]> {
    return this._http.get<string[]>(`http://localhost:3004/api/config/${configItem}`); // TODO error handling
  }

}
