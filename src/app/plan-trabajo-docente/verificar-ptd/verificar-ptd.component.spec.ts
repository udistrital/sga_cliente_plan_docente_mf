import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificarPtdComponent } from './verificar-ptd.component';

describe('VerificarPtdComponent', () => {
  let component: VerificarPtdComponent;
  let fixture: ComponentFixture<VerificarPtdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerificarPtdComponent]
    });
    fixture = TestBed.createComponent(VerificarPtdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
