import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import {
  CdkDragMove,
  CdkDragRelease,
  CdkDragStart,
} from "@angular/cdk/drag-drop";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { PopUpManager } from "src/app/managers/popUpManager";
import { PlanTrabajoDocenteService } from "src/app/services/plan-trabajo-docente.service";
import { OikosService } from "src/app/services/oikos.service";
import { ACTIONS, MODALS, ROLES, VIEWS } from "src/app/models/diccionario";
import { CardDetalleCarga, CoordXY } from "src/app/models/card-detalle-carga";
import { SgaPlanTrabajoDocenteMidService } from "src/app/services/sga-plan-trabajo-docente-mid.service";
import { HorarioMidService } from "src/app/services/horario-mid.service";

@Component({
  selector: "horario-carga-lectiva",
  templateUrl: "./horario-carga-lectiva.component.html",
  styleUrls: ["./horario-carga-lectiva.component.scss"],
})
export class HorarioCargaLectivaComponent implements OnInit, OnChanges {
  /** Definitions for horario */
  readonly horarioSize = {
    days: 7,
    hourIni: 6,
    hourEnd: 23,
    difHoras: 23 - 6,
    stepHour: 0.25,
  };
  readonly containerGridLengths = {
    x: this.horarioSize.days,
    y: this.horarioSize.hourEnd - this.horarioSize.hourIni,
  };
  readonly snapGridSize = { x: 110, y: 75, ymin: 75 * 0.25 }; //px no olvide editarlas en scss si las cambia
  readonly containerGridsize = {
    x: this.containerGridLengths.x * this.snapGridSize.x,
    y: this.containerGridLengths.y * this.snapGridSize.y,
  };
  readonly tipo = { carga_lectiva: 1, actividades: 2 };
  readonly estado = { flotando: 1, ubicado: 2, ocupado: 3 };

  matrixBusy = Array(this.containerGridLengths.x)
    .fill(0)
    .map(() =>
      Array(this.containerGridLengths.y / this.horarioSize.stepHour)
        .fill(0)
        .map(() => false)
    );

  genHoursforTable() {
    return Array(this.horarioSize.hourEnd - this.horarioSize.hourIni)
      .fill(0)
      .map((_, index) => index + this.horarioSize.hourIni);
  }

  @ViewChild("contenedorCargaLectiva", { static: false })
  contenedorCargaLectiva: ElementRef;
  listaCargaLectiva: any[] = [];
  listaEspaciosFisicosOcupados: any[] = [];
  /*************************** */

  /** Entradas y Salidas */
  @Input() WorkingMode: Symbol = Symbol();
  @Input() Rol: string = "";
  @Input() Data: any = undefined;
  @Output() OutLoading: EventEmitter<boolean> = new EventEmitter();
  @Output() DataChanged: EventEmitter<any> = new EventEmitter();

  edit: boolean = false;
  isDocente: boolean = false;
  isCoordinador: boolean = false;
  vinculaciones: any[] = [];
  asignaturas: any[] = [];
  actividades: any[] = [];
  vinculacionSelected: any = undefined;
  asignaturaSelected: any = undefined;
  actividadSelected: any = undefined;
  seleccion: number = 0;
  identificador: number = 0;
  observacion: string = "";
  searchTerm$ = new Subject<any>();
  opcionesEdificios: any[] = [];
  opcionesSedes: any[] = [];
  opcionesSalones: any[] = [];
  opcionesSalonesFiltrados: any[] = [];
  opcionesUsos: any[] = [];
  sede: any;
  edificio: any;
  salon: any;
  grupo: any;
  ubicacionForm: FormGroup;
  ubicacionActive: boolean = false;
  editandoAsignacion: CardDetalleCarga;
  aprobacion: any = undefined;
  EspaciosProyecto: any = undefined;
  manageByTime: boolean = false;
  puedeEditarPTD: boolean = false;
  private dragEnabled = false;

  constructor(
    private popUpManager: PopUpManager,
    private translate: TranslateService,
    private horarioMid: HorarioMidService,
    private planDocenteMid: SgaPlanTrabajoDocenteMidService,
    private planDocenteService: PlanTrabajoDocenteService,
    private builder: FormBuilder,
    private oikosService: OikosService,
    private readonly elementRef: ElementRef
  ) {
    this.contenedorCargaLectiva = this.elementRef.nativeElement;
    this.ubicacionForm = this.builder.group({});
    const x = this.snapGridSize.x * -2.25;
    const y = 0;
    this.editandoAsignacion = {
      id: null,
      nombre: "",
      idCarga: null,
      idEspacioAcademico: null,
      idActividad: null,
      horas: 0,
      horaFormato: null,
      tipo: null,
      sede: null,
      edificio: null,
      salon: null,
      estado: null,
      bloqueado: true,
      dragPosition: { x, y },
      prevPosition: { x, y },
      finalPosition: { x, y },
    };
  }

  async ngOnInit() {
    this.getSedes().then(() => {
      this.OutLoading.emit(false);
    });

    this.ubicacionForm = this.builder.group({
      sede: [null, Validators.required],
      edificio: [null, Validators.required],
      salon: [null, Validators.required],
      horas: [null, Validators.required],
      fecha_ini: [null],
      fecha_fin: [null],
    });

    this.ubicacionForm.get("edificio")?.disable();
    this.ubicacionForm.get("salon")?.disable();
    this.ubicacionForm.get("edificio")?.setValue(undefined);
    this.ubicacionForm.get("salon")?.setValue(undefined);
    this.opcionesEdificios = [];

    this.searchTerm$.pipe(distinctUntilChanged()).subscribe((response: any) => {
      this.opcionesSalonesFiltrados = this.opcionesSalones.filter(
        (value, index, array) =>
          value.Nombre.toLowerCase().includes(response.text.toLowerCase())
      );
    });
  }

  event2text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  habilitarSelectFechas() {
    this.manageByTime = !this.manageByTime;
    const validador = this.manageByTime ? Validators.required : null;
    this.ubicacionForm.get("fecha_ini")?.setValidators(validador);
    this.ubicacionForm.get("fecha_ini")?.updateValueAndValidity();
    this.ubicacionForm.get("fecha_fin")?.setValidators(validador);
    this.ubicacionForm.get("fecha_fin")?.updateValueAndValidity();
  }

  async ngOnChanges() {
    if (this.Data) {
      this.edit = this.WorkingMode == ACTIONS.EDIT;
      this.isDocente = this.Rol == ROLES.DOCENTE;
      this.isCoordinador =
        this.Rol == ROLES.ADMIN_DOCENCIA || this.Rol == ROLES.COORDINADOR;
      this.vinculaciones = this.Data.tipo_vinculacion;
      this.seleccion = this.Data.seleccion;
      this.vinculacionSelected = this.vinculaciones[this.seleccion];
      this.asignaturas = this.Data.espacios_academicos[this.seleccion];
      this.observacion = this.Data.resumenes[this.seleccion].observacion
        ? this.Data.resumenes[this.seleccion].observacion
        : "";
      this.calcularHoras();
      this.calcularHoras(this.tipo.actividades);
      this.calcularHoras(this.tipo.carga_lectiva);
      await this.getActividades();
      this.loadCarga();
      await this.setPuedeEditarPTD();
      this.bloquearElementosTabla();
    } else {
      this.listaCargaLectiva = [];
    }
  }

  getDragPosition(eventDrag: CdkDragMove) {
    const contenedor: DOMRect =
      this.contenedorCargaLectiva.nativeElement.getBoundingClientRect();
    let posicionRelativa = {
      x: Math.floor(
        eventDrag.pointerPosition.x - contenedor.left - this.snapGridSize.x / 2
      ),
      y: Math.floor(
        eventDrag.pointerPosition.y - contenedor.top - this.snapGridSize.ymin
      ),
    };
    posicionRelativa.x = posicionRelativa.x <= 0 ? 0 : posicionRelativa.x;
    posicionRelativa.y = posicionRelativa.y <= 0 ? 0 : posicionRelativa.y;
    posicionRelativa.x =
      Math.round(posicionRelativa.x / this.snapGridSize.x) *
      this.snapGridSize.x;
    posicionRelativa.y =
      Math.round(posicionRelativa.y / this.snapGridSize.ymin) *
      this.snapGridSize.ymin;
    return posicionRelativa;
  }

  chechkUsedRegion(x: number, y: number, h: number) {
    const ymax = y + h / this.horarioSize.stepHour;
    let busy = false;
    for (let index = y; index < ymax; index++) {
      if (this.matrixBusy[x][index]) {
        busy = true;
        break;
      }
    }
    return busy;
  }

  changeStateRegion(x: number, y: number, h: number, state: boolean) {
    const ymax = y + h / this.horarioSize.stepHour;
    for (let index = y; index < ymax; index++) {
      this.matrixBusy[x][index] = state;
    }
  }

  isInsideGrid(element: CardDetalleCarga) {
    const left = 0 <= element.finalPosition.x;
    const right = element.finalPosition.x < this.containerGridsize.x;
    const top = 0 <= element.finalPosition.y;
    const bottom = element.finalPosition.y < this.containerGridsize.y;
    return left && right && top && bottom;
  }

  getPositionforMatrix(element: CardDetalleCarga) {
    const x = Math.floor(element.finalPosition.x / this.snapGridSize.x);
    const y = Math.floor(element.finalPosition.y / this.snapGridSize.ymin);
    return { x, y };
  }

  onDragMoved(event: CdkDragMove, elementMoved: CardDetalleCarga) {
    if (!this.dragEnabled) {
      event.source._dragRef.setFreeDragPosition(elementMoved.prevPosition);
      return;
    }

    if (this.isInsideGrid(elementMoved)) {
      const coord = this.getPositionforMatrix(elementMoved);
      this.changeStateRegion(coord.x, coord.y, elementMoved.horas, false);
    }
    const posicionRelativa = this.getDragPosition(event);
    const x = posicionRelativa.x / this.snapGridSize.x;
    const y = posicionRelativa.y / this.snapGridSize.ymin;
    const ocupado = this.chechkUsedRegion(x, y, elementMoved.horas);
    if (ocupado) {
      elementMoved.dragPosition = elementMoved.prevPosition;
      event.source._dragRef.setFreeDragPosition(elementMoved.prevPosition);
      event.source._dragRef.disabled = true;
      elementMoved.estado = this.estado.ocupado;
    } else {
      elementMoved.dragPosition = posicionRelativa;
      elementMoved.estado = this.estado.ubicado;
    }
    if (
      posicionRelativa.x != elementMoved.prevPosition.x ||
      posicionRelativa.y != elementMoved.prevPosition.y
    ) {
      elementMoved.prevPosition = elementMoved.dragPosition;
      elementMoved.horaFormato = this.calculateTimeSpan(
        elementMoved.dragPosition,
        elementMoved.horas
      );
    }
  }

  onDragStarted(elementMoved: CardDetalleCarga) {
    console.log;
    const periodoId = 31;
    const espacioFisicoId = elementMoved.salon.Id;

    // Desactiva el drag and drop
    this.dragEnabled = false;

    this.horarioMid
      .get(
        `espacio-fisico/ocupados?espacio-fisico-id=${espacioFisicoId}&periodo-id=${periodoId}`
      )
      .subscribe((res: any) => {
        if (res.Success && res.Data.length > 0) {
          res.Data.forEach((element: any) => {
            const ocupado: any = {
              horas: element.horas,
              estado: this.estado.ubicado,
              dragPosition: element.finalPosition,
              prevPosition: element.finalPosition,
              finalPosition: element.finalPosition,
            };
            if (
              !this.listaCargaLectiva.some(
                (carga) => carga.idColocacionEspacioAcademico === element._id
              )
            ) {
              const coord = this.getPositionforMatrix(ocupado);
              this.changeStateRegion(coord.x, coord.y, ocupado.horas, true);
              this.listaEspaciosFisicosOcupados.push(ocupado);
            }
          });
        }
        this.dragEnabled = true;
      });
  }

  calculateTimeSpan(dragPosition: CoordXY, h: number): string {
    const iniTimeRaw =
      dragPosition.y / this.snapGridSize.y + this.horarioSize.hourIni;
    const finTimeRaw = iniTimeRaw + h;
    const horaI = Math.floor(iniTimeRaw);
    const minI = (iniTimeRaw - horaI) * 60;
    const horaF = Math.floor(finTimeRaw);
    const minF = (finTimeRaw - horaF) * 60;
    return (
      String(horaI).padStart(2, "0") +
      ":" +
      String(minI).padEnd(2, "0") +
      " - " +
      String(horaF).padStart(2, "0") +
      ":" +
      String(minF).padEnd(2, "0")
    );
  }

  onDragReleased(event: CdkDragRelease, elementMoved: CardDetalleCarga) {
    this.limpiarListaEspaciosFisicosOcupados();
    if (!this.dragEnabled) {
      elementMoved.dragPosition = elementMoved.prevPosition;
      elementMoved.finalPosition = elementMoved.prevPosition;
      event.source._dragRef.setFreeDragPosition(elementMoved.prevPosition);
      return;
    }

    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("ptd.asignar"),
        this.translate.instant("ptd.ask_mover") +
          "<br>" +
          elementMoved.horaFormato +
          "?",
        MODALS.QUESTION,
        true
      )
      .then((action) => {
        if (action.value) {
          elementMoved.estado = this.estado.ubicado;
          elementMoved.finalPosition = elementMoved.dragPosition;
          if (this.isInsideGrid(elementMoved)) {
            const coord = this.getPositionforMatrix(elementMoved);
            this.changeStateRegion(coord.x, coord.y, elementMoved.horas, true);
          }
        } else {
          if (this.isInsideGrid(elementMoved)) {
            const coord = this.getPositionforMatrix(elementMoved);
            this.changeStateRegion(coord.x, coord.y, elementMoved.horas, false);
          }
          elementMoved.dragPosition = elementMoved.finalPosition;
          elementMoved.prevPosition = elementMoved.dragPosition;
          elementMoved.finalPosition = elementMoved.dragPosition;
          event.source._dragRef.setFreeDragPosition(elementMoved.prevPosition);
          event.source._dragRef.disabled = true;
          elementMoved.estado = this.estado.flotando;
          event.source
            .getRootElement()
            .scrollIntoView({ block: "center", behavior: "smooth" });
        }
      });
  }

  async formularioEspacioFisico() {
    if (this.asignaturaSelected) {
      this.planDocenteMid
        .get(
          "espacio-fisico/dependencia?dependencia=" +
            this.asignaturaSelected.proyecto_id
        )
        .subscribe(
          (res) => {
            if (res.Data.PorAsignar) {
              this.popUpManager.showPopUpGeneric(
                this.translate.instant("ptd.espacio_fisico"),
                this.translate.instant("ptd.proyecto_sin_espacios"),
                MODALS.WARNING,
                false
              );
            }
            this.EspaciosProyecto = res.Data;
            this.opcionesSedes = this.EspaciosProyecto.Sedes;
          },
          (err) => {
            this.popUpManager.showPopUpGeneric(
              this.translate.instant("ERROR.titulo_generico"),
              this.translate.instant("ERROR.persiste_error_comunique_OAS"),
              MODALS.ERROR,
              false
            );
            console.warn(err);
          }
        );
    }
    this.ubicacionActive = true;
  }

  cancelarUbicacion() {
    this.ubicacionForm.reset();
    this.ubicacionActive = false;
    const x = this.snapGridSize.x * -2.25;
    const y = 0;
    this.editandoAsignacion = {
      id: null,
      nombre: "",
      idCarga: null,
      idEspacioAcademico: null,
      idActividad: null,
      horas: 0,
      horaFormato: null,
      tipo: null,
      sede: null,
      edificio: null,
      salon: null,
      estado: null,
      bloqueado: true,
      dragPosition: { x, y },
      prevPosition: { x, y },
      finalPosition: { x, y },
    };
  }

  addCarga() {
    const h = Number(this.ubicacionForm.get("horas")?.value);
    const salon = this.opcionesSalonesFiltrados.find(
      (opcion) => opcion.Nombre == this.ubicacionForm.get("salon")?.value
    );
    const x = this.snapGridSize.x * -2.25;
    const y = 0;

    if (!this.editandoAsignacion.id) {
      this.identificador++;
      const newElement: CardDetalleCarga = {
        id: this.identificador,
        nombre: this.isDocente
          ? this.actividadSelected.nombre
          : this.asignaturaSelected.nombre,
        idCarga: null,
        idEspacioAcademico: this.isDocente ? null : this.asignaturaSelected.id,
        idActividad: this.isDocente ? this.actividadSelected._id : null,
        sede: this.ubicacionForm.get("sede")?.value,
        edificio: this.ubicacionForm.get("edificio")?.value
          ? this.ubicacionForm.get("edificio")?.value
          : "NA",
        salon: salon || "NA",
        horas: h,
        horaFormato: "",
        tipo: this.isDocente ? this.tipo.actividades : this.tipo.carga_lectiva,
        estado: this.estado.flotando,
        bloqueado: false,
        dragPosition: { x: x, y: y },
        prevPosition: { x: x, y: y },
        finalPosition: { x: x, y: y },
      };
      this.listaCargaLectiva.push(newElement);
    } else {
      if (this.isInsideGrid(this.editandoAsignacion)) {
        const coord = this.getPositionforMatrix(this.editandoAsignacion);
        this.changeStateRegion(
          coord.x,
          coord.y,
          this.editandoAsignacion.horas,
          false
        );
      }
      this.editandoAsignacion.horas = h;
      this.editandoAsignacion.sede = this.ubicacionForm.get("sede")?.value;
      this.editandoAsignacion.edificio = this.ubicacionForm.get("edificio")
        ?.value
        ? this.ubicacionForm.get("edificio")?.value
        : "NA";
      this.editandoAsignacion.salon = salon || "NA";
      this.editandoAsignacion.dragPosition = { x: x, y: y };
      this.editandoAsignacion.prevPosition =
        this.editandoAsignacion.dragPosition;
      this.editandoAsignacion.finalPosition =
        this.editandoAsignacion.dragPosition;
      this.editandoAsignacion.estado = this.estado.flotando;
    }

    this.cancelarUbicacion();
  }

  loadCarga() {
    this.listaCargaLectiva = [];

    this.Data.carga[this.seleccion].forEach((carga: any) => {
      console.log(carga);
      this.identificador++;
      let nombre;
      if (carga.espacio_academico_id != "NA") {
        nombre = this.Data.espacios_academicos[this.seleccion].find(
          (espacio: any) => espacio.id == carga.espacio_academico_id
        ).nombre;
      } else {
        nombre = this.actividades.find(
          (actividad) => actividad._id == carga.actividad_id
        )?.nombre;
      }

      const newElement: CardDetalleCarga = {
        id: this.identificador,
        nombre: nombre,
        idCarga: carga.id,
        idEspacioAcademico: carga.espacio_academico_id,
        idColocacionEspacioAcademico: carga.colocacion_espacio_academico_id,
        idActividad: carga.actividad_id,
        horas: carga.horario.horas,
        horaFormato: carga.horario.horaFormato,
        tipo: carga.horario.tipo,
        sede: carga.sede,
        edificio: carga.edificio,
        salon: carga.salon,
        estado: carga.horario.estado,
        bloqueado:
          !this.edit ||
          (this.isDocente && carga.horario.tipo == this.tipo.carga_lectiva) ||
          (this.isCoordinador && carga.horario.tipo == this.tipo.actividades),
        dragPosition: carga.horario.dragPosition,
        prevPosition: carga.horario.prevPosition,
        finalPosition: carga.horario.finalPosition,
      };

      if (this.Data.docentesModular) {
        newElement.modular = true;
        newElement.docente_id = carga.docente_id;
        newElement.docenteName =
          this.Data.docentesModular[carga.docente_id].NombreCorto;
      }

      this.listaCargaLectiva.push(newElement);
      const coord = this.getPositionforMatrix(newElement);
      this.changeStateRegion(coord.x, coord.y, newElement.horas, true);
    });
  }

  async editElement(elementClicked: CardDetalleCarga) {
    if (elementClicked.bloqueado) {
      return;
    }
    this.ubicacionActive = true;

    if (this.isInsideGrid(elementClicked)) {
      const coord = this.getPositionforMatrix(elementClicked);
      this.changeStateRegion(coord.x, coord.y, elementClicked.horas, false);
    }

    this.sede = this.opcionesSedes.find(
      (opcion) => opcion.Id == elementClicked.sede.Id
    );
    this.ubicacionForm.get("sede")?.setValue(this.sede);
    this.cambioSede().then(() => {
      this.edificio = this.opcionesEdificios.find(
        (opcion) => opcion.Id == elementClicked.edificio.Id
      );
      this.ubicacionForm.get("edificio")?.setValue(this.edificio);
      this.cambioEdificio();
      this.ubicacionForm.get("salon")?.setValue(elementClicked.salon.Nombre);
    });
    this.ubicacionForm.get("horas")?.setValue(elementClicked.horas);
    this.editandoAsignacion = elementClicked;
    const c: Element = document.getElementById("ubicacion") as Element;
    await new Promise((f) => setTimeout(f, 10));
    c.scrollIntoView({ behavior: "smooth" });
  }

  deleteElement(htmlElement: any, elementClicked: CardDetalleCarga) {
    if (elementClicked.bloqueado) {
      return;
    }

    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("ptd.borrar"),
        this.translate.instant("ptd.ask_borrar"),
        MODALS.QUESTION,
        true
      )
      .then((action) => {
        if (action.value) {
          this.OutLoading.emit(true);
          if (this.isInsideGrid(elementClicked)) {
            const coord = this.getPositionforMatrix(elementClicked);
            this.changeStateRegion(
              coord.x,
              coord.y,
              elementClicked.horas,
              false
            );
          }
          const idx = this.listaCargaLectiva.findIndex(
            (element) => element.id == elementClicked.id
          );
          this.listaCargaLectiva.splice(idx, 1);
          if (elementClicked.idCarga) {
            this.planDocenteService
              .delete("carga_plan", { Id: elementClicked.idCarga })
              .subscribe((response: any) => {
                this.OutLoading.emit(false);
                this.DataChanged.emit(this.listaCargaLectiva);
              });
          } else {
            this.OutLoading.emit(false);
          }

          // Obtener el contenedor y verificar la relación padre-hijo
          const c: Element = this.contenedorCargaLectiva.nativeElement;

          // Asegurarse de que el elemento a eliminar está dentro del contenedor
          let parentElement = htmlElement.parentElement;
          let isChild = false;

          while (parentElement) {
            if (parentElement === c) {
              isChild = true;
              break;
            }
            parentElement = parentElement.parentElement;
          }

          if (
            isChild &&
            htmlElement.parentElement &&
            htmlElement.parentElement.parentElement
          ) {
            try {
              c.removeChild(htmlElement.parentElement.parentElement);
            } catch (error) {
              // no hacer nada
            }
          }
        }
      });
  }

  calcularHoras(tipo?: number) {
    let total = 0;
    this.listaCargaLectiva.forEach((carga: CardDetalleCarga) => {
      if (this.isInsideGrid(carga) && !carga.modular) {
        if (tipo) {
          if (carga.tipo == tipo) {
            total += carga.horas;
          }
        } else {
          total += carga.horas;
        }
      }
    });
    return total;
  }

  async guardar_ptd() {
    if (!this.puedeEditarPTD) {
      this.popUpManager.showAlert(
        this.translate.instant("ptd.guardado_ptd_error"),
        this.translate.instant("ptd.guardado_ptd_error_msg")
      );
      return;
    }
    this.OutLoading.emit(true);
    let carga_plan = [];

    for (const element of this.listaCargaLectiva) {
      let horaInicio = parseInt(element.horaFormato.split(":")[0]);
      if (!element.bloqueado) {
        carga_plan.push({
          espacio_academico_id: element.idEspacioAcademico,
          actividad_id: element.idActividad,
          id: element.idCarga,
          plan_docente_id: this.Data.plan_docente[this.seleccion],
          sede_id: element.sede.Id,
          edificio_id: element.edificio?.Id ? element.edificio.Id : "",
          salon_id: element.salon?.Id ? element.salon.Id : "",
          horario: {
            horas: element.horas,
            horaFormato: element.horaFormato,
            tipo: element.tipo,
            estado: element.estado,
            dragPosition: element.dragPosition,
            prevPosition: element.prevPosition,
            finalPosition: element.finalPosition,
          },
          hora_inicio: horaInicio,
          duracion: element.horas,
          activo: true,
        });
      }
    }

    let estado_plan_is = "";
    if (this.isCoordinador) {
      if (this.aprobacion) {
        estado_plan_is = this.aprobacion._id;
      } else {
        estado_plan_is = "Sin definir";
      }
    } else {
      estado_plan_is = this.Data.estado_plan[this.seleccion];
    }

    let plan_docente = {
      id: this.Data.plan_docente[this.seleccion],
      resumen: JSON.stringify({
        horas_lectivas: this.calcularHoras(this.tipo.carga_lectiva),
        horas_actividades: this.calcularHoras(this.tipo.actividades),
        observacion: this.observacion,
      }),
      estado_plan: estado_plan_is,
    };

    this.planDocenteMid
      .put("plan/", {
        carga_plan: carga_plan,
        plan_docente: plan_docente,
        descartar: this.Data.descartar ? this.Data.descartar : [],
      })
      .subscribe((response) => {
        this.OutLoading.emit(false);
        if (response.Status == 200) {
          this.popUpManager.showSuccessAlert(
            this.translate.instant("ptd.guardado_ptd_exito") +
              " " +
              this.vinculacionSelected.nombre
          );
          this.DataChanged.emit(this.listaCargaLectiva);
        }
      });
  }

  selectVinculacion(event: any) {
    this.asignaturaSelected = undefined;
    if (event.value == undefined) {
      this.asignaturas = [];
    } else {
      for (let index = 0; index < this.vinculaciones.length; index++) {
        const element = this.vinculaciones[index];
        if (element == event.value) {
          this.seleccion = index;
          this.asignaturas = this.Data.espacios_academicos[this.seleccion];
        }
      }
    }
    this.blockcargas();
  }

  blockcargas() {
    this.listaCargaLectiva.forEach((element: CardDetalleCarga) => {
      if (this.asignaturas.find((asignatura) => asignatura.id == element.id)) {
        element.bloqueado = false;
      } else {
        element.bloqueado = true;
      }
    });
  }

  getSedes() {
    return new Promise((resolve, reject) => {
      this.oikosService
        .get(
          "espacio_fisico?query=TipoEspacioFisicoId.Id:38,Activo:true&limit=0&fields=Id,Nombre,CodigoAbreviacion&sortby=Nombre&order=asc"
        )
        .subscribe(
          (res) => {
            this.opcionesSedes = res;
            resolve(res);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  cambioSede() {
    this.opcionesEdificios = [];
    this.opcionesSalones = [];
    this.opcionesSalonesFiltrados = [];
    this.ubicacionForm.get("edificio")?.disable();
    this.ubicacionForm.get("salon")?.disable();
    this.ubicacionForm.get("edificio")?.setValue(undefined);
    this.ubicacionForm.get("salon")?.setValue(undefined);
    return new Promise((resolve, reject) => {
      if (this.asignaturaSelected) {
        this.opcionesEdificios =
          this.EspaciosProyecto.Edificios[
            this.ubicacionForm.get("sede")?.value.Id
          ];
        this.opcionesEdificios.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
        this.ubicacionForm.get("edificio")?.enable();
        resolve(this.opcionesEdificios);
      } else {
        this.oikosService
          .get(
            `espacio_fisico_padre?query=PadreId.Id:${
              this.ubicacionForm.get("sede")?.value.Id
            }&fields=HijoId&limit=0`
          )
          .subscribe((res) => {
            res.forEach((element: any) => {
              this.opcionesEdificios.push(element.HijoId);
              this.ubicacionForm.get("edificio")?.enable();
            });
            this.opcionesEdificios.sort((a, b) =>
              a.Nombre.localeCompare(b.Nombre)
            );
            resolve(res);
          });
      }
    });
  }

  cambioEdificio() {
    this.opcionesSalones = [];
    this.opcionesSalonesFiltrados = [];
    this.ubicacionForm.get("salon")?.disable();
    this.ubicacionForm.get("salon")?.setValue(undefined);
    if (this.asignaturaSelected) {
      this.opcionesSalones =
        this.EspaciosProyecto.Salones[
          this.ubicacionForm.get("edificio")?.value.Id
        ];
      this.opcionesSalones.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
      this.opcionesSalonesFiltrados = this.opcionesSalones;
      this.ubicacionForm.get("salon")?.enable();
    } else {
      this.oikosService
        .get(
          `espacio_fisico_padre?query=PadreId.Id:${
            this.ubicacionForm.get("edificio")?.value.Id
          }&fields=HijoId&limit=0`
        )
        .subscribe((res) => {
          res.forEach((element: any) => {
            this.opcionesSalones.push(element.HijoId);
            this.ubicacionForm.get("salon")?.enable();
          });
          this.opcionesSalones.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
          this.opcionesSalonesFiltrados = this.opcionesSalones;
        });
    }
  }

  cambioSalon(element: any) {
    this.salon = element.option.value;
    this.ubicacionForm.get("salon")?.setValue(this.salon.Nombre);
  }

  getActividades() {
    return new Promise((resolve, reject) => {
      this.planDocenteService
        .get("actividad?query=activo:true&fields=nombre")
        .subscribe(
          (res: any) => {
            this.actividades = res.Data;
            resolve(res);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  limpiarListaEspaciosFisicosOcupados() {
    if (this.listaEspaciosFisicosOcupados.length > 0) {
      this.listaEspaciosFisicosOcupados.forEach((ocupado) => {
        const coord = this.getPositionforMatrix(ocupado);
        this.changeStateRegion(coord.x, coord.y, ocupado.horas, false);
      });
      this.listaEspaciosFisicosOcupados = [];
    }
  }

  getEstadoPDT(): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.planDocenteService
        .get(`plan_docente/${this.Data.plan_docente[this.seleccion]}`)
        .subscribe(
          (response: any) => {
            if (response?.Status == 200) {
              let data = response.Data;
              const estado_plan_id = data.estado_plan_id;
              this.planDocenteService
                .get(`estado_plan/${estado_plan_id}`)
                .subscribe(
                  (response: any) => {
                    if (response?.Status == 200) {
                      resolve(response.Data);
                    } else {
                      resolve(null);
                    }
                  },
                  (error) => {
                    reject(false);
                  }
                );
            } else {
              resolve(null);
            }
          },
          (error) => {
            reject(false);
          }
        );
    });
  }

  async setPuedeEditarPTD(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (this.isCoordinador) {
        this.puedeEditarPTD = true;
        resolve();
        return;
      }

      if (this.isDocente) {
        try {
          const estado = await this.getEstadoPDT();
          if (estado) {
            this.puedeEditarPTD = estado.codigo_abreviacion === "ENV_COO";
          }
        } catch (error) {
          this.puedeEditarPTD = false;
        } finally {
          resolve();
        }
        return;
      }

      this.puedeEditarPTD = false;
      resolve();
    });
  }

  bloquearElementosTabla(): void {
    if (!this.puedeEditarPTD || this.WorkingMode === ACTIONS.VIEW) {
      this.listaCargaLectiva.forEach((element) => {
        element.bloqueado = true;
      });
    }
  }
}
