export class PreAsignacion {
    _id: string;
    docente_id: string;
    tipo_vinculacion_id: string;
    espacio_academico_id: string;
    periodo_id: string;
    aprobacion_docente: boolean;
    aprobacion_proyecto: boolean;
    plan_docente_id: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<PreAsignacion>) {
        this._id = data._id ?? '';
        this.docente_id = data.docente_id ?? '';
        this.tipo_vinculacion_id = data.tipo_vinculacion_id ?? '';
        this.espacio_academico_id = data.espacio_academico_id ?? '';
        this.periodo_id = data.periodo_id ?? '';
        this.aprobacion_docente = data.aprobacion_docente ?? false;
        this.aprobacion_proyecto = data.aprobacion_proyecto ?? false;
        this.plan_docente_id = data.plan_docente_id ?? '';
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}