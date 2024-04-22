export class EspaciosAcademicos {
    _id: string;
    nombre: string;
    codigo_abreviacion: string;
    codigo: string;
    plan_estudio_id: string;
    proyecto_academico_id: number;
    creditos: number;
    distribucion_horas: string;
    tipo_espacio_id: number;
    clasificacion_espacio_id: number;
    enfoque_id: number;
    espacios_requeridos: string;
    grupo: string;
    inscritos: number;
    periodo_id: number;
    docente_id: number;
    horario_id: string;
    espacio_academico_padre: string;
    soporte_documental: string;
    estado_aprobacion_id: string;
    observacion: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<EspaciosAcademicos>) {
        this._id = data._id ?? '';
        this.nombre = data.nombre ?? '';
        this.codigo_abreviacion = data.codigo_abreviacion ?? '';
        this.codigo = data.codigo ?? '';
        this.plan_estudio_id = data.plan_estudio_id ?? '';
        this.proyecto_academico_id = data.proyecto_academico_id ?? 0;
        this.creditos = data.creditos ?? 0;
        this.distribucion_horas = data.distribucion_horas ?? '';
        this.tipo_espacio_id = data.tipo_espacio_id ?? 0;
        this.clasificacion_espacio_id = data.clasificacion_espacio_id ?? 0;
        this.enfoque_id = data.enfoque_id ?? 0;
        this.espacios_requeridos = data.espacios_requeridos ?? '';
        this.grupo = data.grupo ?? '';
        this.inscritos = data.inscritos ?? 0;
        this.periodo_id = data.periodo_id ?? 0;
        this.docente_id = data.docente_id ?? 0;
        this.horario_id = data.horario_id ?? '';
        this.espacio_academico_padre = data.espacio_academico_padre ?? '';
        this.soporte_documental = data.soporte_documental ?? '';
        this.estado_aprobacion_id = data.estado_aprobacion_id ?? '';
        this.observacion = data.observacion ?? '';
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}