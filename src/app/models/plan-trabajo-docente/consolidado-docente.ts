export class ConsolidadoDocente {
    _id: string;
    plan_docente_id: string;
    periodo_id: string;
    proyecto_academico_id: string;
    estado_consolidado_id: string;
    respuesta_decanatura: string;
    consolidado_coordinacion: string;
    cumple_normativa: boolean;
    aprobado: boolean;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<ConsolidadoDocente>) {
        this._id = data._id ?? '';
        this.plan_docente_id = data.plan_docente_id ?? '';
        this.periodo_id = data.periodo_id ?? '';
        this.proyecto_academico_id = data.proyecto_academico_id ?? '';
        this.estado_consolidado_id = data.estado_consolidado_id ?? '';
        this.respuesta_decanatura = data.respuesta_decanatura ?? '';
        this.consolidado_coordinacion = data.consolidado_coordinacion ?? '';
        this.cumple_normativa = data.cumple_normativa ?? false;
        this.aprobado = data.aprobado ?? false;
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}