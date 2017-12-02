import { TestBed, inject } from '@angular/core/testing';

import { LearningModeService } from './learning-mode.service';

describe('LearningModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LearningModeService]
    });
  });

  it('should be created', inject([LearningModeService], (service: LearningModeService) => {
    expect(service).toBeTruthy();
  }));
});
