import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoCrearEspacioGrupoComponent } from './dialogo-crear-espacio-grupo.component';

describe('DialogoCrearEspacioGrupoComponent', () => {
  let component: DialogoCrearEspacioGrupoComponent;
  let fixture: ComponentFixture<DialogoCrearEspacioGrupoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoCrearEspacioGrupoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogoCrearEspacioGrupoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
