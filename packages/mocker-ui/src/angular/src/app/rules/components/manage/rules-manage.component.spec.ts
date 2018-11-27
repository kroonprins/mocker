import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesManageComponent } from './rules-manage.component';

describe('RulesManageComponent', () => {
  let component: RulesManageComponent;
  let fixture: ComponentFixture<RulesManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RulesManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
