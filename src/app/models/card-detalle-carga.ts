export interface CardDetalleCarga {
    id: number|null;
    nombre: string;
    idCarga: string|null;
    idEspacioAcademico: string|null;
    idActividad: string|null;
    horas: number;
    horaFormato: string|null;
    sede: any,
    edificio: any,
    salon: any,
    tipo: number|null;
    estado: number|null;
    bloqueado: boolean;
    dragPosition: CoordXY;
    prevPosition: CoordXY;
    finalPosition: CoordXY;
    modular?: boolean;
    docente_id?: string;
    docenteName?: string;
}

export interface CoordXY {
    x: number;
    y: number;
}