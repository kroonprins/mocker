import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { AppConfigurationService } from './app-configuration.service';

@Injectable()
export class ConfigDropdownService {

  private apiServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.apiServerLocation = this.appConfigurationService.retrieveApiServerLocation();
  }

  retrieveConfigItem (configItem: string): Observable<string[]> {
    return this._http.get<string[]>(`${this.apiServerLocation}/api/config/${configItem}`); // TODO error handling
  }

}
