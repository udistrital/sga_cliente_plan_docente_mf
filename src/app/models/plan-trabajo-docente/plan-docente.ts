export class PlanDocente {
    _id: string;
    estado_plan_id: string;
    docente_id: string;
    tipo_vinculacion_id: string;
    periodo_id: string;
    soporte_documental: string;
    respuesta: string;
    resumen: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<PlanDocente>) {
        this._id = data._id ?? '';
        this.estado_plan_id = data.estado_plan_id ?? '';
        this.docente_id = data.docente_id ?? '';
        this.tipo_vinculacion_id = data.tipo_vinculacion_id ?? '';
        this.periodo_id = data.periodo_id ?? '';
        this.soporte_documental = data.soporte_documental ?? '';
        this.respuesta = data.respuesta ?? '';
        this.resumen = data.resumen ?? '';
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}