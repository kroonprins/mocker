import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfigurationService } from './app-configuration.service';

@Injectable()
export class ConfigDropdownService {

  private cache: Map<string, any> = new Map<string, any>();

  private apiServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.apiServerLocation = this.appConfigurationService.retrieveApiServerLocation();
  }

  retrieveConfigItem (configItem: string): Observable<any> {
    if (this.cache.has(configItem)) {
      return of(this.cache.get(configItem));
    }
    return this._http.get(`${this.apiServerLocation}/api/config/${configItem}`).pipe(tap(response => {
      this.cache.set(configItem, response);
    })); // TODO error handling
  }

}
