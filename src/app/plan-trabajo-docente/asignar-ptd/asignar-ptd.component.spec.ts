import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarPtdComponent } from './asignar-ptd.component';

describe('AsignarPtdComponent', () => {
  let component: AsignarPtdComponent;
  let fixture: ComponentFixture<AsignarPtdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsignarPtdComponent]
    });
    fixture = TestBed.createComponent(AsignarPtdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
