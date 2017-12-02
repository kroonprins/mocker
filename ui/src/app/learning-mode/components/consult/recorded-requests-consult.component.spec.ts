import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordedRequestsConsultComponent } from './recorded-requests-consult.component';

describe('RecordedRequestsConsultComponent', () => {
  let component: RecordedRequestsConsultComponent;
  let fixture: ComponentFixture<RecordedRequestsConsultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordedRequestsConsultComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordedRequestsConsultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
