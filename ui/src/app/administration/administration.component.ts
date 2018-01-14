import { Component, OnInit } from '@angular/core';
import { AdministrationService } from './services/administration.service';
import { LogLevels } from './model/logger';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.sass']
})
export class AdministrationComponent implements OnInit {

  logLevels: LogLevels;

  constructor(private administrationService: AdministrationService) { }

  ngOnInit() {
    this.administrationService.retrieveCurrentLogLevels().subscribe(logLevels => {
      this.logLevels = logLevels;
    });
  }

  updateLogLevel() {
    this.administrationService.updateLogLevels(this.logLevels).subscribe(result => {
      this.ngOnInit();
    });
  }

}
