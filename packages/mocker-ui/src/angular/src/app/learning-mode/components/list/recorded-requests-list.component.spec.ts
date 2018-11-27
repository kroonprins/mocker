import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordedRequestsListComponent } from './recorded-requests-list.component';

describe('RecordedRequestsListComponent', () => {
  let component: RecordedRequestsListComponent;
  let fixture: ComponentFixture<RecordedRequestsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordedRequestsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordedRequestsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
