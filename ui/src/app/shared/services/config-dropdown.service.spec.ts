import { TestBed, inject } from '@angular/core/testing';

import { ConfigDropdownService } from './config-dropdown.service';

describe('ConfigDropdownService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigDropdownService]
    });
  });

  it('should be created', inject([ConfigDropdownService], (service: ConfigDropdownService) => {
    expect(service).toBeTruthy();
  }));
});
