export class CargaPlan {
    _id: string;
    espacio_academico_id: string;
    actividad_id: string;
    plan_docente_id: string;
    colocacion_espacio_academico_id: string;
    salon_id: string;
    hora_inicio: number;
    duracion: number;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<CargaPlan>) {
        this._id = data._id ?? '';
        this.espacio_academico_id = data.espacio_academico_id ?? '';
        this.actividad_id = data.actividad_id ?? '';
        this.plan_docente_id = data.plan_docente_id ?? '';
        this.colocacion_espacio_academico_id = data.colocacion_espacio_academico_id ?? '';
        this.salon_id = data.salon_id ?? '';
        this.hora_inicio = data.hora_inicio ?? 0;
        this.duracion = data.duracion ?? 0;
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}