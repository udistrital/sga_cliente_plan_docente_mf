export class EstadoConsolidado {
    _id: string;
    nombre: string;
    descripcion: string;
    codigo_abreviacion: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;

    constructor(data: Partial<EstadoConsolidado>) {
        this._id = data._id ?? '';
        this.nombre = data.nombre ?? '';
        this.descripcion = data.descripcion ?? '';
        this.codigo_abreviacion = data.codigo_abreviacion ?? '';
        this.activo = data.activo ?? false;
        this.fecha_creacion = data.fecha_creacion ?? '';
        this.fecha_modificacion = data.fecha_modificacion ?? '';
    }
}