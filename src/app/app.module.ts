import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { PreasignacionComponent } from "./plan-trabajo-docente/preasignacion/preasignacion.component";
import { AsignarPtdComponent } from "./plan-trabajo-docente/asignar-ptd/asignar-ptd.component";
import { VerificarPtdComponent } from "./plan-trabajo-docente/verificar-ptd/verificar-ptd.component";
import { RevisionConsolidadoComponent } from "./plan-trabajo-docente/revision-consolidado/revision-consolidado.component";
import { ConsolidadoComponent } from "./plan-trabajo-docente/consolidado/consolidado.component";

import { MATERIAL_MODULES } from "./imports/material";
import { DIRECTIVES } from "./imports/directives";
import { SERVICES_HTTP } from "./imports/services";

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { environment } from "src/environments/environment";

import { UserService } from "./services/user.service";

// Componentes propios
import { ActionButtonComponent } from "./micro-components/action-button.component";
import { ActionCheckComponent } from "./micro-components/action-check.component";

import { DialogoPreAsignacionPtdComponent } from "./dialog-components/dialogo-preasignacion/dialogo-preasignacion.component";
import { DialogoAsignarPeriodoComponent } from "./dialog-components/dialogo-asignar-periodo/dialogo-asignar-periodo.component";
import { DialogoFirmaPtdComponent } from "./dialog-components/dialogo-firma-ptd/dialogo-firma-ptd.component";
import { DialogPreviewFileComponent } from "./dialog-components/dialog-preview-file/dialog-preview-file.component";
import { DialogoCrearEspacioGrupoComponent } from "./dialog-components/dialogo-crear-espacio-grupo/dialogo-crear-espacio-grupo.component";
import { DialogoVerDetalleColocacionComponent } from "./dialog-components/dialogo-ver-detalles-colocacion/dialogo-ver-detalle-colocacion.component";

import { HorarioCargaLectivaComponent } from "./componentes/horario-carga-lectiva/horario-carga-lectiva.component";
import { AsignarPtdMultipleComponent } from "./componentes/asignar-ptd-multiple/asignar-ptd-multiple.component";

// Loader translate
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(
    http,
    environment.apiUrl + "assets/i18n/",
    ".json"
  );
}

@NgModule({
  declarations: [
    AppComponent,

    PreasignacionComponent,
    AsignarPtdComponent,
    VerificarPtdComponent,
    RevisionConsolidadoComponent,
    ConsolidadoComponent,

    ...DIRECTIVES,

    ActionButtonComponent,
    ActionCheckComponent,

    DialogoPreAsignacionPtdComponent,
    DialogoAsignarPeriodoComponent,
    DialogoFirmaPtdComponent,
    DialogPreviewFileComponent,
    DialogoCrearEspacioGrupoComponent,
    DialogoVerDetalleColocacionComponent,

    HorarioCargaLectivaComponent,
    AsignarPtdMultipleComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,

    ...MATERIAL_MODULES,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),

    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    ...SERVICES_HTTP,
    UserService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}