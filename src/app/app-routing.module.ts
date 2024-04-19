import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { EmptyRouteComponent } from './empty-route/empty-route.component';
import { PreasignacionComponent } from './plan-trabajo-docente/preasignacion/preasignacion.component';
import { AsignarPtdComponent } from './plan-trabajo-docente/asignar-ptd/asignar-ptd.component';
import { VerificarPtdComponent } from './plan-trabajo-docente/verificar-ptd/verificar-ptd.component';
import { ConsolidadoComponent } from './plan-trabajo-docente/consolidado/consolidado.component';
import { RevisionConsolidadoComponent } from './plan-trabajo-docente/revision-consolidado/revision-consolidado.component';

const routes: Routes = [
  {
    path: '',
    component: EmptyRouteComponent,
  },
  {
    path: 'preasignacion',
    component: PreasignacionComponent,
  },
  {
    path: 'asignar-ptd',
    component: AsignarPtdComponent,
  },
  {
    path: 'verificar-ptd',
    component: VerificarPtdComponent,
  },
  {
    path: 'consolidado',
    component: ConsolidadoComponent,
  },
  {
    path: 'revision-consolidado',
    component: RevisionConsolidadoComponent,
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/ptd/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch())
  ]
})
export class AppRoutingModule { }
