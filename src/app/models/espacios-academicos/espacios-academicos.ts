export interface EspaciosAcademicos {
    _id?: string;
    nombre?: string;
    codigo_abreviacion?: string;
    codigo?: string;
    plan_estudio_id?: string;
    proyecto_academico_id?: number;
    creditos?: number;
    distribucion_horas?: string;
    tipo_espacio_id?: number;
    clasificacion_espacio_id?: number;
    enfoque_id?: number;
    espacios_requeridos?: string;
    grupo?: string;
    inscritos?: number;
    periodo_id?: number;
    docente_id?: number;
    horario_id?: string;
    espacio_academico_padre?: string;
    soporte_documental?: string;
    estado_aprobacion_id?: string;
    observacion?: string;
    activo?: boolean;
    fecha_creacion?: string;
    fecha_modificacion?: string;
}