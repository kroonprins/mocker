import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigDropdownComponent } from './config-dropdown.component';

describe('ConfigDropdownComponent', () => {
  let component: ConfigDropdownComponent;
  let fixture: ComponentFixture<ConfigDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigDropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
