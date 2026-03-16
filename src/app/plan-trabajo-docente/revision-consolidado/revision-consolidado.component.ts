import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { MODALS, ROLES, VIEWS } from 'src/app/models/diccionario';
import { Periodo } from 'src/app/models/parametros/periodo';
import { EstadoConsolidado } from 'src/app/models/plan-trabajo-docente/estado-consolidado';
import { RespFormat } from 'src/app/models/response-format';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanTrabajoDocenteService } from 'src/app/services/plan-trabajo-docente.service';
import { ProyectoAcademicoService } from 'src/app/services/proyecto-academico.service';
import { TercerosService } from 'src/app/services/terceros.service';
import { UserService } from 'src/app/services/user.service';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { cloneDeep as _cloneDeep } from 'lodash';

@Component({
  selector: 'app-revision-consolidado',
  templateUrl: './revision-consolidado.component.html',
  styleUrls: ['./revision-consolidado.component.scss']
})
export class RevisionConsolidadoComponent implements OnInit, AfterViewInit {

  readonly VIEWS = VIEWS;
  readonly ESTADOS = {
    DEF: '64d1b9ab7344af1caa53ea59',
    ENV: '64e4c32cd9308025c135db2d',
    AVA: '64e4c34cd93080396f35db2f',
    APR: '64e4c382d93080d1e835db31',
    N_APR: '64e4c3a5d93080299535db34',
    ENV_AVA: '64e61208a659b2fca5b0bd6a',
  };
  vista: Symbol;

  isSecDecanatura: string|undefined = undefined;
  isDecano: string|undefined = undefined;

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = ["proyecto_curricular", "codigo", "fecha_radicado", "periodo_academico", "gestion", "estado", "enviar"];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  periodos: {select: any, opciones: Periodo[]};
  proyectos: {select: any, opciones: any[]};
  estadosConsolidado: {select: any, opciones: any[]};

  formRevConsolidado: FormGroup;
  revConsolidadoInfo: any = undefined;
  consolidadoSololectura = false;
  archivoSoporteUrl: string | null = null;
  archivoSoporteNombre: string | null = null;
  opcionesDecision: { id: string; nombre: string }[] = [];
  
  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private parametrosService: ParametrosService,
    private proyectoAcademicoService: ProyectoAcademicoService,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private tercerosService: TercerosService,
    private gestorDocumentalService: GestorDocumentalService,
    private builder: FormBuilder,
  ) {
    this.vista = VIEWS.LIST;
    this.dataSource = new MatTableDataSource();
    this.periodos = {select: undefined, opciones: []};
    this.proyectos = {select: undefined, opciones: []};
    this.estadosConsolidado = {select: undefined, opciones: []};
    this.formRevConsolidado = this.builder.group({});
  }

  ngOnInit() {
    this.userService.getUserRoles().then(roles => {
      this.isSecDecanatura = roles.find(role => (role == ROLES.SEC_DECANATURA));
      this.isDecano = roles.find(role => (role == ROLES.DECANO));
    });
    this.loadSelects();
    this.buildForm();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  buildForm() {
    this.formRevConsolidado = this.builder.group({
      ArchivoSoporte: [{ value: '', disabled: true }],
      QuienResponde: [{ value: '', disabled: true }, Validators.required],
      Rol: [{ value: '', disabled: true }, Validators.required],
      CumpleNorma: [false],
      Observaciones: ['', Validators.required],
      Decision: ['', Validators.required],
    });
  }

  accionGestion(event: any) {
    const readonly = event.rowData.gestion.type !== 'editar';
    this.revisarConsolidado(event.rowData.ConsolidadoJson, readonly);
  }

  accionEnviar(event: any) {
    let putPlan = _cloneDeep(event.rowData.ConsolidadoJson);
    putPlan.estado_consolidado_id = this.ESTADOS.ENV_AVA;
    this.planTrabajoDocenteService.put('consolidado_docente/'+putPlan._id, putPlan).subscribe(
      () => {
        this.popUpManager.showSuccessAlert(this.translate.instant('ptd.actualizar_consolidado_ok'))
        this.listarConsolidados();
      }, err => {
        console.warn(err);
        this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_actualizar_consolidado'))
      }
    );
  }

  loadPeriodo(): Promise<Periodo[]> {
    return new Promise((resolve, reject) => {
      this.parametrosService.get('periodo?query=CodigoAbreviacion:PA&sortby=Id&order=desc&limit=0').subscribe({
        next: (resp: RespFormat) => {
          if (checkResponse(resp) && checkContent(resp.Data)) {
            resolve(resp.Data as Periodo[]);
          } else {
            reject(new Error('No se encontraron periodos'));
          }
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  loadProyectos(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.proyectoAcademicoService.get('proyecto_academico_institucion?query=Activo:true&sortby=Nombre&order=asc&limit=0').subscribe({
        next: (resp: any) => {
          if (checkContent(resp)) {
            resolve(resp as any[]);
          } else {
            reject(new Error('No se encontraron proyectos'));
          }
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  cargarEstadosConsolidado(): Promise<EstadoConsolidado[]> {
    return new Promise((resolve, reject) => {
      this.planTrabajoDocenteService.get('estado_consolidado?query=activo:true&limit=0').subscribe({
        next: (res) => {
          if (res.Data.length > 0) {
            resolve(res.Data)
          } else {
            reject(new Error('No se encontraron estados de plan'))
          }
        },
        error: (err) => {
          reject(err)
        }
      });
    });
  }

  async loadSelects() {
    try {
      let promesas: Promise<void>[] = [];
      promesas.push(this.loadPeriodo().then(periodos => {this.periodos.opciones = periodos}));
      promesas.push(this.loadProyectos().then(proyectos => {this.proyectos.opciones = proyectos;}));
      promesas.push(this.cargarEstadosConsolidado().then(estadosConsolidado => {
        this.estadosConsolidado.opciones = estadosConsolidado;
      }));
      await Promise.all(promesas);
    } catch (error) {
      console.warn(error);
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.sin_informacion_en') + ': <b>' + error + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
  }

  listarConsolidados() {
    if (this.periodos.select) {
      let proyecto = ""
      if (this.proyectos.select) {
        proyecto = ",proyecto_academico_id:"+this.proyectos.select.Id;
      }
      this.planTrabajoDocenteService.get(`consolidado_docente?query=activo:true,periodo_id:${this.periodos.select.Id}${proyecto}&limit=0`).subscribe((resp) => {
        const idEstadosFiltro = this.idEstadosSegunRol();
        let rawlistarConsolidados = <any[]>resp.Data;
        rawlistarConsolidados = rawlistarConsolidados.filter(consolidado => idEstadosFiltro.includes(consolidado.estado_consolidado_id));
        const formatedData = this.estilizarDatosSegunRol(rawlistarConsolidados);
        this.dataSource = new MatTableDataSource(formatedData);
      }, (err) => {
        this.dataSource = new MatTableDataSource();
        console.warn(err);
      });
    }
  }

  idEstadosSegunRol(): string[] {
    if (this.isSecDecanatura) {
      return [this.ESTADOS.ENV, this.ESTADOS.AVA, this.ESTADOS.N_APR, this.ESTADOS.ENV_AVA];
    }
    if (this.isDecano) {
      return [this.ESTADOS.ENV_AVA, this.ESTADOS.APR, this.ESTADOS.N_APR];
    }
    return [];
  }

  estilizarDatosSegunRol(consolidados: any[]): any[] {
    let formatedData: any[] = [];
    consolidados.forEach(consolidado => {
      const proyecto = this.proyectos.opciones.find(proyecto => proyecto.Id == consolidado.proyecto_academico_id);
      const periodo = this.periodos.opciones.find(periodo => periodo.Id == consolidado.periodo_id);
      const estadoConsolidado = this.estadosConsolidado.opciones.find(estado => estado._id == consolidado.estado_consolidado_id);
      let opcionGestion = "ver";
      if ((consolidado.estado_consolidado_id === this.ESTADOS.ENV) && (this.isSecDecanatura)) {
        opcionGestion = "editar";
      }
      if ((consolidado.estado_consolidado_id === this.ESTADOS.ENV_AVA) && (this.isDecano)) {
        opcionGestion = "editar";
      }
      formatedData.push({
        "proyecto_curricular": proyecto ? proyecto.Nombre : "",
        "codigo": proyecto ? proyecto.Codigo : "",
        "fecha_radicado": this.formatoFecha(consolidado.fecha_creacion),
        "periodo_academico": periodo ? periodo.Nombre : "",
        "gestion": { value: undefined, type: opcionGestion, disabled: (!this.isSecDecanatura && !this.isDecano) },
        "estado": estadoConsolidado ? estadoConsolidado.nombre : consolidado.estado_consolidado_id,
        "enviar": { value: undefined, type: 'enviar', disabled: (!this.isSecDecanatura) || (consolidado.estado_consolidado_id !== this.ESTADOS.AVA) },
        "ConsolidadoJson": consolidado
      })
    })
    return formatedData;
  }

  formatoFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  }

  revisarConsolidado(consolidado: any, readonly?: boolean) {
    this.revConsolidadoInfo = _cloneDeep(consolidado);
    this.consolidadoSololectura = !!readonly;
    this.archivoSoporteUrl = null;
    this.archivoSoporteNombre = null;

    this.formRevConsolidado.patchValue({
      ArchivoSoporte: '',
      QuienResponde: '',
      Rol: this.isSecDecanatura ? 'Secretaria Decanatura' : 'Decanatura',
      CumpleNorma: !!consolidado.cumple_normativa,
      Observaciones: '',
      Decision: '',
    });

    this.configurarOpcionesPorRol();

    const estadoActualId = consolidado.estado_consolidado_id;
    if (this.isSecDecanatura) {
      const decisionSec = estadoActualId === this.ESTADOS.N_APR ? this.ESTADOS.N_APR : this.ESTADOS.AVA;
      if ([this.ESTADOS.AVA, this.ESTADOS.N_APR, this.ESTADOS.ENV_AVA].includes(estadoActualId)) {
        this.formRevConsolidado.patchValue({ Decision: decisionSec });
      }
    }
    if (this.isDecano && [this.ESTADOS.APR, this.ESTADOS.N_APR].includes(estadoActualId)) {
      this.formRevConsolidado.patchValue({ Decision: estadoActualId });
    }

    const consolidadoCoordinacion = this.parseJson(this.revConsolidadoInfo.consolidado_coordinacion, {});
    if (consolidadoCoordinacion.documento_id) {
      this.cargarArchivoSoporte(consolidadoCoordinacion.documento_id);
    }

    const respuestaDecanatura = this.parseJson(this.revConsolidadoInfo.respuesta_decanatura, { sec: {}, dec: {} });
    let terceroId = 0;
    if (this.isSecDecanatura && respuestaDecanatura?.sec) {
      this.formRevConsolidado.patchValue({ Observaciones: respuestaDecanatura.sec.observacion || '' });
      terceroId = respuestaDecanatura.sec.responsable_id || 0;
    }
    if (this.isDecano && respuestaDecanatura?.dec) {
      this.formRevConsolidado.patchValue({ Observaciones: respuestaDecanatura.dec.observacion || '' });
      terceroId = respuestaDecanatura.dec.responsable_id || 0;
    }

    if (!terceroId) {
      this.userService.getPersonaId().then((personaId) => {
        this.cargarResponsable(personaId);
      });
    } else {
      this.cargarResponsable(terceroId);
    }

    this.vista = VIEWS.FORM;
    if (this.consolidadoSololectura) {
      this.formRevConsolidado.disable();
    } else {
      this.formRevConsolidado.enable();
      this.formRevConsolidado.get('ArchivoSoporte')?.disable();
      this.formRevConsolidado.get('QuienResponde')?.disable();
      this.formRevConsolidado.get('Rol')?.disable();
      if (!this.isSecDecanatura) {
        this.formRevConsolidado.get('CumpleNorma')?.disable();
      }
    }
  }

  async validarFormRevConsolidado() {
    if (!this.revConsolidadoInfo || this.formRevConsolidado.invalid) {
      this.formRevConsolidado.markAllAsTouched();
      return;
    }

    const putPlan = _cloneDeep(this.revConsolidadoInfo);
    const personaId = await this.userService.getPersonaId();
    const respuestaDecanatura = this.parseJson(putPlan.respuesta_decanatura, { sec: {}, dec: {} });

    if (this.isSecDecanatura) {
      respuestaDecanatura.sec = {
        ...respuestaDecanatura.sec,
        responsable_id: personaId,
        observacion: this.formRevConsolidado.get('Observaciones')?.value,
      };
      putPlan.cumple_normativa = !!this.formRevConsolidado.get('CumpleNorma')?.value;
    }

    if (this.isDecano) {
      respuestaDecanatura.dec = {
        ...respuestaDecanatura.dec,
        responsable_id: personaId,
        observacion: this.formRevConsolidado.get('Observaciones')?.value,
      };
    }

    putPlan.estado_consolidado_id = this.formRevConsolidado.get('Decision')?.value;
    putPlan.aprobado = putPlan.estado_consolidado_id === this.ESTADOS.APR;
    putPlan.respuesta_decanatura = JSON.stringify(respuestaDecanatura);

    this.planTrabajoDocenteService.put('consolidado_docente/' + putPlan._id, putPlan).subscribe(
      () => {
        this.popUpManager.showSuccessAlert(this.translate.instant('ptd.actualizar_consolidado_ok'));
        this.regresar();
      },
      (err) => {
        console.warn(err);
        this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_actualizar_consolidado'));
      }
    );
  }

  private configurarOpcionesPorRol() {
    if (this.isSecDecanatura) {
      this.opcionesDecision = [
        { id: this.ESTADOS.AVA, nombre: 'Enviar para aprobacion por decanatura' },
        { id: this.ESTADOS.N_APR, nombre: 'Enviar a coordinacion para su revision' },
      ];
      this.formRevConsolidado.get('CumpleNorma')?.enable();
      return;
    }

    this.opcionesDecision = [
      { id: this.ESTADOS.APR, nombre: 'Aprobar consolidado' },
      { id: this.ESTADOS.N_APR, nombre: 'No aprobar consolidado' },
    ];
    this.formRevConsolidado.get('CumpleNorma')?.disable();
  }

  private cargarArchivoSoporte(documentoId: number) {
    this.gestorDocumentalService.get([
      {
        Id: documentoId,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ]).subscribe({
      next: (resp: any[]) => {
        if (resp && resp.length > 0) {
          this.archivoSoporteUrl = resp[0].url;
          this.archivoSoporteNombre = resp[0].Nombre || 'Consolidado.xlsx';
          this.formRevConsolidado.patchValue({ ArchivoSoporte: this.archivoSoporteNombre });
        }
      },
      error: (err) => {
        console.warn(err);
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.error_cargar_documento'));
      }
    });
  }

  descargarArchivoSoporte() {
    if (this.archivoSoporteUrl && this.archivoSoporteNombre) {
      const link = document.createElement('a');
      link.href = this.archivoSoporteUrl;
      link.download = this.archivoSoporteNombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private cargarResponsable(terceroId: number) {
    this.tercerosService.get('tercero/' + terceroId).subscribe({
      next: (resTerc: any) => {
        this.formRevConsolidado.patchValue({ QuienResponde: resTerc.NombreCompleto || '' });
      },
      error: (err) => {
        console.warn(err);
      }
    });
  }

  private parseJson(value: any, defaultValue: any) {
    if (!value) {
      return defaultValue;
    }
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return defaultValue;
    }
  }

  regresar() {
    this.vista = VIEWS.LIST;
    this.revConsolidadoInfo = undefined;
    this.consolidadoSololectura = false;
    this.listarConsolidados();
  }

}
