import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from '../../managers/popUpManager';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, startWith } from 'rxjs/operators';
import { ParametrosService } from '../../services/parametros.service';
import { SgaPlanTrabajoDocenteMidService } from '../../services/sga-plan-trabajo-docente-mid.service';
import { EspaciosAcademicosService } from '../../services/espacios-academicos.service';
import { PlanTrabajoDocenteService } from 'src/app/services/plan-trabajo-docente.service';
import { TercerosService } from 'src/app/services/terceros.service';
import { Periodo } from 'src/app/models/parametros/periodo';
import { RespFormat } from 'src/app/models/response-format';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { EspaciosAcademicos } from 'src/app/models/espacios-academicos/espacios-academicos';
import { MODALS } from 'src/app/models/diccionario';
import { DialogoAsignarPeriodoComponent } from '../dialogo-asignar-periodo/dialogo-asignar-periodo.component';

@Component({
  selector: 'dialogo-preasignacion',
  templateUrl: './dialogo-preasignacion.component.html',
  styleUrls: ['./dialogo-preasignacion.component.scss']
})
export class DialogoPreAsignacionPtdComponent implements OnInit {

  modificando: boolean = true;
  preasignacionForm: FormGroup;

  searchTerm$ = new Subject<any>();
  opcionesDocente: any[] = [];
  filteredDocentes: Observable<any[]> = of([]);
  docente: any;

  opcionesEspaciosAcademicos: EspaciosAcademicos[] = [];
  opcionesProyectos: any[] = [];
  opcionesGrupos: any[] = [];
  opcionesGruposTodas: any[] = [];
  periodos: Periodo[] = [];
  periodo: Periodo = new Periodo({});
  documento_docente: any;
  espacio_academico: any;
  grupo: any;

  // TODO: vinculación quemada aquí ???
  tipoVinculacion = [
    { id: 293, nombre: 'Carrera tiempo completo' },
    { id: 294, nombre: 'Carrera medio tiempo' },
    { id: 296, nombre: 'Tiempo completo ocasional' },
    { id: 297, nombre: 'Hora cátedra prestaciones' },
    { id: 298, nombre: 'Medio tiempo ocasional' },
    { id: 299, nombre: 'Hora cátedra por honorarios' }
  ];

  constructor (
    public dialogRef: MatDialogRef<DialogoPreAsignacionPtdComponent>,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private sgaPlanTrabajoDocenteMidService: SgaPlanTrabajoDocenteMidService,
    private espaciosAcademicosService: EspaciosAcademicosService,
    private parametrosService: ParametrosService,
    private tercerosService: TercerosService,
    private builder: FormBuilder,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any,
  ) {
    this.preasignacionForm = this.builder.group({});
  }

  ngOnInit() {
    if (this.data.docente == undefined) {
      this.modificando = false;
      this.data = {
        tipo_vinculacion_id: null,
        docente: null,
        codigo: null,
        espacio_academico: null,
        grupo: null,
        proyecto: null,
        nivel: null,
        periodo_id: null,
        doc_docente: null,
      };
      this.preasignacionForm = this.builder.group({
        tipo_vinculacion: [this.data.tipo_vinculacion_id, Validators.required],
        docente: [this.data.docente, Validators.required],
        codigo: [this.data.codigo, Validators.required],
        espacio_academico: [this.data.espacio_academico, Validators.required],
        grupo: [this.data.grupo, Validators.required],
        proyecto: [this.data.proyecto, Validators.required],
        nivel: [this.data.nivel, Validators.required],
        periodo: [this.data.periodo_id, Validators.required],
        doc_docente: [this.data.doc_docente, Validators.required],
      });
    } else {
      this.preasignacionForm = this.builder.group({
        tipo_vinculacion: [this.data.tipo_vinculacion_id, Validators.required],
        docente: [this.data.docente.toLocaleLowerCase(), Validators.required],
        codigo: [this.data.codigo, Validators.required],
        espacio_academico: [this.data.espacio_academico, Validators.required],
        grupo: [this.data.grupo, Validators.required],
        proyecto: [this.data.proyecto, Validators.required],
        nivel: [this.data.nivel, Validators.required],
        periodo: [this.data.periodo_id, Validators.required],
        doc_docente: [this.documento_docente, Validators.required],
      });
    }

    this.preasignacionForm.get("docente")?.disable();
    this.preasignacionForm.get("codigo")?.disable();
    this.preasignacionForm.get("espacio_academico")?.disable();
    this.preasignacionForm.get("grupo")?.disable();
    this.preasignacionForm.get("proyecto")?.disable();
    this.preasignacionForm.get("nivel")?.disable();
    this.preasignacionForm.get("doc_docente")?.disable();

    this.filteredDocentes = this.preasignacionForm.get("docente")?.valueChanges.pipe(startWith(''), map(value => this._filterDocente(value || '')))||of([]);
    
    this.preasignacionForm.get("tipo_vinculacion")?.valueChanges.subscribe(value => {
      if (this.preasignacionForm.get("periodo")?.value != null) {
        this.preasignacionForm.get("docente")?.enable();
        this.preasignacionForm.get("doc_docente")?.enable();
      }
    });

    this.preasignacionForm.get("periodo")?.valueChanges.subscribe(value => {
      console.log("value", value)
      if (this.preasignacionForm.get("tipo_vinculacion")?.value != null) {
        this.preasignacionForm.get("docente")?.enable();
        this.preasignacionForm.get("doc_docente")?.enable();
      }
    });

    this.cargarPeriodo().then((periodos) => {
      this.periodos = periodos.filter( periodo => periodo.Activo === true);
      // this.periodo = periodos.find(p => p.Activo) ?? new Periodo({});
      this.cargarEspaciosAcademicos().then((espaciosAcademicos) => {
        this.opcionesEspaciosAcademicos = espaciosAcademicos;
        if (this.modificando) {
          this.loadPreasignacion();
        }
      }).catch((error) => {
        console.log(error);
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.sin_espacios_academicos'));
        this.opcionesEspaciosAcademicos = [];
      });
    }).catch((error) => {
      console.log(error);
      this.popUpManager.showErrorToast(this.translate.instant('ERROR.sin_periodos'));
      this.periodos = [];
    });

    this.opcionesDocente = []
    this.searchTerm$
      .pipe(
        debounceTime(700),
        distinctUntilChanged(),
        filter(data => (data.text).length > 3),
        switchMap(({ text, field }) => this.buscarNombreDocentes(text, field)),
      ).subscribe((response: any) => {
        this.opcionesDocente = response.queryOptions.Data.filter((value: any, index: any, array: any) => index == array.findIndex((item: any) => item.Id == value.Id));
      });

    this.dialogRef.backdropClick().subscribe(() => { this.dialogRef.close(); });
  }

  event2text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private _filterDocente(value: string): string[] {
    if (value.length > 1) {
      const filterValue = value.toLowerCase();
      if (this.opcionesDocente.length > 0) {
        return this.opcionesDocente.filter(option => option.Nombre.toLowerCase().includes(filterValue));
      }
    }
    return [];
  }

  enviarPreasignacion() {
    console.log(this.preasignacionForm);
    if (this.preasignacionForm.valid) {
      let request = {
        "docente_id": String(this.docente.Id),
        "tipo_vinculacion_id": String(this.preasignacionForm.get("tipo_vinculacion")?.value),
        "espacio_academico_id": this.grupo.Id,
        "periodo_id": String(this.preasignacionForm.get("periodo")?.value.Id),
        "aprobacion_docente": false,
        "aprobacion_proyecto": false,
        "activo": true
      }
      const esp_acad_padre = this.preasignacionForm.get("espacio_academico")?.value;
      if (esp_acad_padre.espacio_modular ? esp_acad_padre.espacio_modular : false) {
        this.savePreasign(request);
      } else if (this.modificando) { // ? si es editing salta verificacion de no preasignado
        this.savePreasign(request);
      } else {
        // ? no modular -> solo se registra una vez la preasignacion -> verificar previa preasignacion
        this.planTrabajoDocenteService.get(`pre_asignacion?query=activo:true,espacio_academico_id:${this.grupo.Id},periodo_id:${this.periodo.Id}`).subscribe({
          next: (resp) => {
            if (resp.Data.length == 0) {
              // ? continue presasignacion si cero para el grupo en particular
              this.savePreasign(request);
            } else {
              this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.seleccion_docente'), this.translate.instant('ptd.no_valid_pre_asignacion'), MODALS.WARNING, false);
            }
          },
          error: (err) => {
            this.popUpManager.showPopUpGeneric(
              this.translate.instant('ERROR.titulo_generico'),
              this.translate.instant('ERROR.fallo_informacion_en') + ': <b>pre_asignacion</b>.<br><br>' +
              this.translate.instant('ERROR.persiste_error_comunique_OAS'),
              MODALS.ERROR, false
            );
            console.log(err)
          }
        });
      }
    } else {
      this.popUpManager.showErrorAlert(this.translate.instant('ptd.alerta_campos_preasignacion'));
    }
  }

  savePreasign(request: any) {
    if (this.modificando) {
      this.planTrabajoDocenteService.put('pre_asignacion/' + this.data.id, request).subscribe({
        next: (response: any) => {
          this.popUpManager.showSuccessAlert(this.translate.instant('ptd.preasignacion_actualizada'));
          this.dialogRef.close();
        },
        error: (error: any) => {
          this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_actualizar_preasignacion'));
        },
      });
    } else {
      this.planTrabajoDocenteService.post('pre_asignacion', request).subscribe({
        next: (response: any) => {
          this.popUpManager.showSuccessAlert(this.translate.instant('ptd.preasignacion_creada'));
          this.dialogRef.close();
        },
        error: (error: any) => {
          this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_crear_preasignacion'));
        },
      });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  buscarNombreDocentes(text: string, field: any) {
    let query = `docente/nombre?nombre=${text}&vinculacion=${this.preasignacionForm.get("tipo_vinculacion")?.value}`;
    const channelOptions = new BehaviorSubject<any>({ field: field });
    const options$ = channelOptions.asObservable();
    const queryOptions$ = this.sgaPlanTrabajoDocenteMidService.get(query)

    return combineLatest([options$, queryOptions$]).pipe(
      map(([options$, queryOptions$]) => ({
        options: options$,
        queryOptions: queryOptions$,
        keyToFilter: text,
      })),
    );
  }

  setDocente(element: any) {
    this.docente = element.option.value;
    this.documento_docente = this.docente.Documento;
    this.preasignacionForm.get("doc_docente")?.setValue(this.documento_docente);
    this.preasignacionForm.get("docente")?.setValue(element.option.value.Nombre);
    this.preasignacionForm.get("codigo")?.enable();
    this.preasignacionForm.get("espacio_academico")?.enable();
  }

  cargarPeriodo(): Promise<Periodo[]> {
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

  cargarEspaciosAcademicos(): Promise<EspaciosAcademicos[]> {
    return new Promise((resolve, reject) => {
      this.espaciosAcademicosService.get('espacio-academico?query=activo:true,espacio_academico_padre' +
        '&limit=0&fields=codigo,nombre,_id').subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp) && checkContent(resp.Data)) {
              resolve(resp.Data as EspaciosAcademicos[]);
            } else {
              reject(new Error('No se encontraron Espacios Academicos'));
            }
          },
          error: (err) => {
            reject(err);
          }
        });
    });
  }

  buscarDocenteDocumento() {
    if (this.preasignacionForm.get("doc_docente")?.value != null) {
      this.sgaPlanTrabajoDocenteMidService.get(`docente/documento?documento=${this.preasignacionForm.get("doc_docente")?.value}` +
        `&vinculacion=${this.preasignacionForm.get("tipo_vinculacion")?.value}`).subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp) && checkContent(resp.Data)) {
              this.docente = resp.Data[0];
              this.documento_docente = this.docente.Documento;
              this.preasignacionForm.get("doc_docente")?.setValue(this.docente.Documento);
              this.preasignacionForm.get("docente")?.setValue(this.docente.Nombre);
              this.preasignacionForm.get("codigo")?.enable();
              this.preasignacionForm.get("espacio_academico")?.enable();
            } else {
              this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_docente'));
            }
          },
          error: (err) => {
            console.log(err);
            this.popUpManager.showErrorToast(this.translate.instant('ptd.error_no_found_docente'));
          }
        });
    } else {
      this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_doc_docente'));
    }
  }

  buscarEspacioAcademico() {
    if (this.preasignacionForm.get("codigo")?.value != null) {
      this.espaciosAcademicosService.get(`espacio-academico?query=codigo:${this.preasignacionForm.get("codigo")?.value},activo:true,espacio_academico_padre` +
        `&fields=codigo,nombre,_id`).subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp) && checkContent(resp.Data)) {
              this.preasignacionForm.get("espacio_academico")?.setValue(
                this.opcionesEspaciosAcademicos.find(espacio => espacio._id == resp.Data[0]._id)
              );
              this.preasignacionForm.get("grupo")?.enable();
              this.preasignacionForm.get("proyecto")?.enable();
              this.preasignacionForm.get("nivel")?.enable();
            } else {
              this.preasignacionForm.get("espacio_academico")?.setValue(null);
              this.preasignacionForm.get("grupo")?.disable();
              this.preasignacionForm.get("proyecto")?.disable();
              this.preasignacionForm.get("nivel")?.disable();
              this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_espacio_academico'));
            }
          },
          error: (err) => {
            console.log(err);
            this.preasignacionForm.get("espacio_academico")?.setValue(null);
            this.preasignacionForm.get("grupo")?.disable();
            this.preasignacionForm.get("proyecto")?.disable();
            this.preasignacionForm.get("nivel")?.disable();
            this.popUpManager.showErrorToast(this.translate.instant('ptd.error_no_found_espacio_academico'));
          }
        });
    } else {
      this.preasignacionForm.get("espacio_academico")?.setValue(null);
      this.preasignacionForm.get("grupo")?.disable();
      this.preasignacionForm.get("proyecto")?.disable();
      this.preasignacionForm.get("nivel")?.disable();
      this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_codigo'));
    }
  }

  loadProyectos() {
    return new Promise((resolve, reject) => {
      if (this.preasignacionForm.get("espacio_academico")?.value != null) {
        this.espacio_academico = this.preasignacionForm.get("espacio_academico")?.value;
        this.preasignacionForm.get("codigo")?.setValue(this.espacio_academico.codigo);
        this.preasignacionForm.get("grupo")?.enable();
        this.preasignacionForm.get("proyecto")?.enable();
        this.preasignacionForm.get("nivel")?.enable();

        this.sgaPlanTrabajoDocenteMidService.get(`espacio-academico/grupo?padre=` +
          `${this.espacio_academico._id}&vigencia=${this.periodo.Id}`).subscribe({
            next: (resp: any) => {
              if (checkResponse(resp) && checkContent(resp.Data)) {
                this.opcionesGrupos = resp.Data;
                this.opcionesGruposTodas = resp.Data;
                resp.Data.forEach((element: any) => {
                  if (!this.opcionesProyectos.some(opcion => opcion === element.ProyectoAcademico)) {
                    this.opcionesProyectos.push(element.ProyectoAcademico);
                  }
                });
                resolve(this.opcionesGrupos);
              }
            },
            error: (err) => {
              console.log(err);
              this.showAcademicSpaceGroup2AssingPeriod(this.espacio_academico._id);
              //this.popUpManager.showErrorToast(this.translate.instant('ptd.error_no_found_proyectos'));
              //reject(this.opcionesGrupos);
            }
          });

      } else {
        this.preasignacionForm.get("codigo")?.setValue(null);
        this.preasignacionForm.get("grupo")?.disable();
        this.preasignacionForm.get("proyecto")?.disable();
        this.preasignacionForm.get("nivel")?.disable();
        reject(this.opcionesGrupos);
      }
    });
  }

  changeProyecto() {
    if (this.preasignacionForm.get("proyecto")?.value != null) {
      let proyecto = this.preasignacionForm.get("proyecto")?.value;
      let auxGrupos: any[] = [];
      this.opcionesGruposTodas.forEach(element => {
        if (element.ProyectoAcademico === proyecto) {
          auxGrupos.push(element);
        }
      });
      this.opcionesGrupos = auxGrupos;
      this.preasignacionForm.get("nivel")?.setValue(auxGrupos[0].Nivel);
    } else {
      this.opcionesGrupos = this.opcionesGruposTodas;
      this.preasignacionForm.get("nivel")?.setValue(null);
      this.preasignacionForm.get("grupo")?.setValue(null);
    }
  }

  changeGrupo() {
    if (this.preasignacionForm.get("grupo")?.value != null) {
      this.grupo = this.preasignacionForm.get("grupo")?.value;
      this.preasignacionForm.get("nivel")?.setValue(this.grupo.Nivel);
      this.preasignacionForm.get("proyecto")?.setValue(this.grupo.ProyectoAcademico);
    } else {
      this.preasignacionForm.get("nivel")?.setValue(null);
      this.preasignacionForm.get("proyecto")?.setValue(null);
    }
  }

  loadPreasignacion() {
    this.tercerosService.get(`datos_identificacion?query=TerceroId.Id:${this.data.docente_id},Activo:true&fields=Numero`).subscribe((res: any) => {
      this.preasignacionForm.get("doc_docente")?.setValue(res[0].Numero);
      this.buscarDocenteDocumento();
      this.preasignacionForm.get("espacio_academico")?.setValue(this.opcionesEspaciosAcademicos.find(espacio => espacio._id == this.data.espacio_academico_padre));
      this.loadProyectos().then((res: any) => {
        this.preasignacionForm.get("grupo")?.setValue(this.opcionesGrupos.find(grupo => grupo.Id == this.data.espacio_academico_id));
        this.changeGrupo();
      });
      this.preasignacionForm.get("tipo_vinculacion")?.setValue(parseInt(this.data.tipo_vinculacion_id));
      this.preasignacionForm.get("periodo")?.setValue(this.periodos.find(periodo => periodo.Id == this.data.periodo_id));
    })
  }

  loadAcademicSpacePreassignment() {
    return new Promise((resolve, reject) => {
      if (this.preasignacionForm.get("espacio_academico")?.value != null) {
        this.espacio_academico = this.preasignacionForm.get("espacio_academico")?.value;
        this.preasignacionForm.get("codigo")?.setValue(this.espacio_academico.codigo);
        this.preasignacionForm.get("grupo")?.enable();
        this.preasignacionForm.get("proyecto")?.enable();
        this.preasignacionForm.get("nivel")?.enable();

        this.sgaPlanTrabajoDocenteMidService.get(`espacio-academico/grupo?padre=${this.espacio_academico._id}&vigencia=${this.periodo.Id}`).subscribe({
          next: (res: RespFormat) => {
          if (checkResponse(res) && checkContent(res.Data)) {
            this.opcionesGrupos = res.Data;
            this.opcionesGruposTodas = res.Data;
            this.opcionesProyectos = [];
            this.preasignacionForm.get("nivel")?.setValue(null);
            this.preasignacionForm.get("proyecto")?.setValue(null);
 
            res.Data.forEach((element: any) => {
              if (!this.opcionesProyectos.some(opcion => opcion === element.ProyectoAcademico)) {
                this.opcionesProyectos.push(element.ProyectoAcademico);
              }
            });
            resolve(this.opcionesGrupos);
          } else {
            reject(this.opcionesGrupos);
          }
        }, 
        error: (error) => {
          this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_proyectos'));
          this.preasignacionForm.get("codigo")?.setValue(null);
          this.preasignacionForm.get("grupo")?.disable();
          this.preasignacionForm.get("proyecto")?.disable();
          this.preasignacionForm.get("nivel")?.disable();
          reject(this.opcionesGrupos);
        }
        });

      } else {
        this.preasignacionForm.get("codigo")?.setValue(null);
        this.preasignacionForm.get("grupo")?.disable();
        this.preasignacionForm.get("proyecto")?.disable();
        this.preasignacionForm.get("nivel")?.disable();
        reject(this.opcionesGrupos);
      }
    });
  }

  showAcademicSpaceGroup2AssingPeriod(academicSpaceId: string) {
    const dialogAssignPeriodConfig = new MatDialogConfig();
    dialogAssignPeriodConfig.width = '55vw';
    dialogAssignPeriodConfig.minWidth = '550px';
    dialogAssignPeriodConfig.height = '30vh';
    dialogAssignPeriodConfig.maxHeight = '300px';
    dialogAssignPeriodConfig.data = {
      espacio_academico_sin_periodo: academicSpaceId,
      periodo_id: this.periodo.Id
    };
    const assignPeriodDialog = this.dialog.open(DialogoAsignarPeriodoComponent, dialogAssignPeriodConfig);
    assignPeriodDialog.afterClosed().subscribe(result => {
      this.loadAcademicSpacePreassignment().then((res: any) => {
      }).catch(err => {
        this.preasignacionForm.get("codigo")?.setValue(null);
        this.preasignacionForm.get("grupo")?.disable();
        this.preasignacionForm.get("proyecto")?.disable();
        this.preasignacionForm.get("nivel")?.disable();
      });
    });
  }
}
