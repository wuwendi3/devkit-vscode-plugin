import { TestBed } from '@angular/core/testing';

import { CustomValidatorsService } from '../custom-validators.service';

describe('CustomValidatorsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CustomValidatorsService = TestBed.inject(CustomValidatorsService);
    expect(service).toBeTruthy();
  });
});
