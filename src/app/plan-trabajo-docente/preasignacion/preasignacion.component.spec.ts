import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreasignacionComponent } from './preasignacion.component';

describe('PreasignacionComponent', () => {
  let component: PreasignacionComponent;
  let fixture: ComponentFixture<PreasignacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PreasignacionComponent]
    });
    fixture = TestBed.createComponent(PreasignacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
