import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PreasignacionComponent } from './plan-trabajo-docente/preasignacion/preasignacion.component';
import { AsignarPtdComponent } from './plan-trabajo-docente/asignar-ptd/asignar-ptd.component';
import { VerificarPtdComponent } from './plan-trabajo-docente/verificar-ptd/verificar-ptd.component';
import { RevisionConsolidadoComponent } from './plan-trabajo-docente/revision-consolidado/revision-consolidado.component';
import { ConsolidadoComponent } from './plan-trabajo-docente/consolidado/consolidado.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MATERIAL_MODULES } from './imports/material';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { SpinnerUtilInterceptor, SpinnerUtilModule } from 'spinner-util';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from 'src/environments/environment';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SERVICES_HTTP } from './imports/services';
import { DIRECTIVES } from './imports/directives';
import { UserService } from './services/user.service';
import { CommonModule } from '@angular/common';
import { ActionButtonComponent } from './micro-components/action-button.component';
import { ActionCheckComponent } from './micro-components/action-check.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogoPreAsignacionPtdComponent } from './dialog-components/dialogo-preasignacion/dialogo-preasignacion.component';
import { DialogoAsignarPeriodoComponent } from './dialog-components/dialogo-asignar-periodo/dialogo-asignar-periodo.component';
import { HorarioCargaLectivaComponent } from './componentes/horario-carga-lectiva/horario-carga-lectiva.component'
import { AsignarPtdMultipleComponent } from './componentes/asignar-ptd-multiple/asignar-ptd-multiple.component';
import { DialogoFirmaPtdComponent } from './dialog-components/dialogo-firma-ptd/dialogo-firma-ptd.component';
import { DialogPreviewFileComponent } from './dialog-components/dialog-preview-file/dialog-preview-file.component'
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, environment.apiUrl + 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    // ? mis componentes
    PreasignacionComponent,
    AsignarPtdComponent,
    VerificarPtdComponent,
    RevisionConsolidadoComponent,
    ConsolidadoComponent,
    // ? directivas
    DIRECTIVES,
    // ? componentes micro
    ActionButtonComponent,
    ActionCheckComponent,
    // ? componentes de dialogo
    DialogoPreAsignacionPtdComponent,
    DialogoAsignarPeriodoComponent,
    DialogoFirmaPtdComponent,
    DialogPreviewFileComponent,
    // ? componentes transversales
    HorarioCargaLectivaComponent,
    AsignarPtdMultipleComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    MATERIAL_MODULES,
    HttpClientModule,
    SpinnerUtilModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerUtilInterceptor, multi: true },
    SERVICES_HTTP,
    UserService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
