import { EspaciosAcademicosService } from "../services/espacios-academicos-service";
import { OikosService } from "../services/oikos.service";
import { ParametrosService } from "../services/parametros.service";
import { PlanTrabajoDocenteService } from "../services/plan-trabajo-docente.service";
import { SgaEspaciosAcademicosMidService } from "../services/sga-espacios-academicos-mid.service";
import { SgaPlanTrabajoDocenteMidService } from "../services/sga-plan-trabajo-docente-mid.service";
import { TercerosService } from "../services/terceros.service";

export const SERVICES_HTTP = [
    ParametrosService,
    PlanTrabajoDocenteService,
    SgaPlanTrabajoDocenteMidService,
    EspaciosAcademicosService,
    TercerosService,
    OikosService,
    SgaEspaciosAcademicosMidService,
];