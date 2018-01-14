import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigurationService } from '../../shared/services/app-configuration.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/observable/of';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { LogLevels } from '../model/logger';

@Injectable()
export class AdministrationService {

  private administrationServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.administrationServerLocation = this.appConfigurationService.retrieveAdministrationServerLocation();
  }

  retrieveCurrentLogLevels(): Observable<LogLevels> {
    return this._http.get<LogLevels>(`${this.administrationServerLocation}/administration/loglevel`).map(logLevels => {
      if (!('level' in logLevels.parent)) {
        logLevels.parent.level = undefined;
      }
      logLevels.parent.initialLevel = logLevels.parent.level;
      for (const childLogger of logLevels.children) {
        childLogger.initialLevel = childLogger.level;
      }
      return logLevels;
    });
  }

  updateLogLevels(logLevels: LogLevels): Observable<void> {
    if (logLevels.parent.level && logLevels.parent.level !== logLevels.parent.initialLevel) {
      return this._http.put(`${this.administrationServerLocation}/administration/loglevel`, {
        level: logLevels.parent.level
      }).map(response => {
        return;
      });
    } else {
      const requests: Observable<Object>[] = [];
      for (const childLogger of logLevels.children) {
        if (childLogger.level === childLogger.initialLevel) {
          continue;
        }
        requests.push(this._http.put(`${this.administrationServerLocation}/administration/loglevel/${childLogger.id}`, {
          level: childLogger.level
        }));
      }
      return forkJoin(requests)
        .map(res => {
          return;
        });
    }
  }

}
