import { TestBed, inject } from '@angular/core/testing';

import { AppConfigurationService } from './app-configuration.service';

describe('AppConfigurationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppConfigurationService]
    });
  });

  it('should be created', inject([AppConfigurationService], (service: AppConfigurationService) => {
    expect(service).toBeTruthy();
  }));
});
