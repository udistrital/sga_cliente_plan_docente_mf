import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoPreAsignacionPtdComponent } from './dialogo-preasignacion.component';

describe('dialogoPreAsignacionPtdComponent', () => {
  let component: DialogoPreAsignacionPtdComponent;
  let fixture: ComponentFixture<DialogoPreAsignacionPtdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DialogoPreAsignacionPtdComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogoPreAsignacionPtdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
