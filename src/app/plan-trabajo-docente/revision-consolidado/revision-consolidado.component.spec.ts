import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionConsolidadoComponent } from './revision-consolidado.component';

describe('RevisionConsolidadoComponent', () => {
  let component: RevisionConsolidadoComponent;
  let fixture: ComponentFixture<RevisionConsolidadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisionConsolidadoComponent]
    });
    fixture = TestBed.createComponent(RevisionConsolidadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
