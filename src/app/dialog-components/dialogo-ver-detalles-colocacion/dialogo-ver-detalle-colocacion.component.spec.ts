import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogoVerDetalleColocacionComponent } from "./dialogo-ver-detalle-colocacion.component";

describe("DialogoVerDetallesColocacionComponent", () => {
  let component: DialogoVerDetalleColocacionComponent;
  let fixture: ComponentFixture<DialogoVerDetalleColocacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoVerDetalleColocacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogoVerDetalleColocacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
