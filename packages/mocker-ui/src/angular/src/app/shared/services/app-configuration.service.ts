import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppConfig } from '../model/app-config';

@Injectable()
export class AppConfigurationService {

  apiServerLocation: string;
  administrationServerLocation: string;

  constructor(private _http: HttpClient) {
  }

  retrieveApiServerLocation(): string {
    return this.apiServerLocation;
  }

  retrieveAdministrationServerLocation(): string {
    return this.administrationServerLocation;
  }

  initializeAppConfiguration(): Promise<void> {
    return this._http.get<AppConfig>('/config').pipe(catchError(e => {
      return of({
        apiServerLocation: 'http://localhost:3004',
        administrationServerLocation: 'http://localhost:3001'
      });
    })).toPromise().then(config => {
      this.apiServerLocation = config.apiServerLocation;
      this.administrationServerLocation = config.administrationServerLocation;
    });
  }
}
