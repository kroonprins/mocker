import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NameValuePairsComponent } from './name-value-pairs.component';

describe('NameValuePairsComponent', () => {
  let component: NameValuePairsComponent;
  let fixture: ComponentFixture<NameValuePairsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NameValuePairsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NameValuePairsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
