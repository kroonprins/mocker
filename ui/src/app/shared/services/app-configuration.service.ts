import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

@Injectable()
export class AppConfigurationService {

  apiServerLocation: string;

  constructor(private _http: HttpClient) {
  }

  retrieveApiServerLocation(): string {
    return this.apiServerLocation;
  }

  initializeApiServerLocation(): Promise<void> {
    return this._http.get('/api-server-location').map(response => {
      return <string>response['location'];
    }).catch(e => {
      return Observable.of('http://localhost:3004');
    }).toPromise().then(location => {
      this.apiServerLocation = location;
    });
  }
}
