import { Component, OnInit, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { SgaPlanTrabajoDocenteMidService } from 'src/app/services/sga-plan-trabajo-docente-mid.service';
import { RespFormat } from 'src/app/models/response-format';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { SgaEspaciosAcademicosMidService } from 'src/app/services/sga-espacios-academicos-mid.service';

@Component({
  selector: 'dialogo-asignar-periodo',
  templateUrl: './dialogo-asignar-periodo.component.html',
  styleUrls: ['./dialogo-asignar-periodo.component.scss']
})
export class DialogoAsignarPeriodoComponent implements OnInit {

  assignPeriodForm: FormGroup;
  groupsList: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogoAsignarPeriodoComponent>,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private sgaPlanTrabajoDocenteMidService: SgaPlanTrabajoDocenteMidService,
    private builder: FormBuilder,
    private sgaEspaciosAcademicosMidService: SgaEspaciosAcademicosMidService,
    @Inject(MAT_DIALOG_DATA) private data: any,
  ) {
    this.assignPeriodForm = this.builder.group({});
  }

  ngOnInit() {
    this.data = {
      ...this.data,
      ...{
        nivel: null,
        subnivel: null,
        proyecto: null,
        espacio_academico: null,
        gruposSeleccionados: null,
      }
    };
    this.assignPeriodForm = this.builder.group({
      nivel: [this.data.nivel, Validators.required],
      subnivel: [this.data.subnivel, Validators.required],
      proyecto: [this.data.proyecto, Validators.required],
      espacio_academico: [this.data.espacio_academico, Validators.required],
      gruposSeleccionados: [this.data.gruposSeleccionados, Validators.required],
    });
    this.loadAcademicGroupData().then(() => {
      this.assignPeriodForm.get("nivel")?.setValue(this.data.nivel);
      this.assignPeriodForm.get("subnivel")?.setValue(this.data.subnivel);
      this.assignPeriodForm.get("proyecto")?.setValue(this.data.proyecto);
      this.assignPeriodForm.get("espacio_academico")?.setValue(this.data.espacio_academico);

      this.assignPeriodForm.get("nivel")?.enable();
      this.assignPeriodForm.get("subnivel")?.enable();
      this.assignPeriodForm.get("proyecto")?.enable();
      this.assignPeriodForm.get("espacio_academico")?.enable();
      this.assignPeriodForm.get("gruposSeleccionados")?.enable();
    });

    this.assignPeriodForm.get("nivel")?.disable();
    this.assignPeriodForm.get("subnivel")?.disable();
    this.assignPeriodForm.get("proyecto")?.disable();
    this.assignPeriodForm.get("espacio_academico")?.disable();
    this.assignPeriodForm.get("gruposSeleccionados")?.disable();
  }

  loadAcademicGroupData() {
    return new Promise((resolve, reject) => {
      const urlGetGroups2AssignPeriod = `espacio-academico/grupo-padre?padre=${this.data.espacio_academico_sin_periodo}`
      this.sgaPlanTrabajoDocenteMidService.get(urlGetGroups2AssignPeriod).subscribe({
        next: (resp: RespFormat) => {
          if (checkResponse(resp) && checkContent(resp.Data)) {
            const spaceData = resp.Data[0];
            const groups = spaceData.Grupos;
            groups.forEach((element: any) => {
              this.groupsList.push(element);
            });
            this.data.nivel = spaceData.Nivel;
            this.data.subnivel = spaceData.Subnivel;
            this.data.proyecto = spaceData.ProyectoAcademico;
            this.data.espacio_academico = spaceData.Nombre;
            resolve(this.data);
          } else {
            this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_espacio_academico'));
            reject();
          }
        },
        error: (error) => {
          this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_espacio_academico'));
          this.dialogRef.close();
          reject(error);
        }
      });
    });
  }

  sendAssingPeriodGroups(){
    if (this.assignPeriodForm.valid){
      const assignPeriodData: any = {};
      assignPeriodData.grupo = this.assignPeriodForm.get("gruposSeleccionados")?.value;
      assignPeriodData.periodo_id = this.data.periodo_id;
      assignPeriodData.padre = this.data.espacio_academico_sin_periodo;

      this.sgaEspaciosAcademicosMidService.put('espacios-academicos/hijos/asignar-periodo', 
      assignPeriodData).subscribe({
        next: (response: any) => {
          this.popUpManager.showSuccessAlert(this.translate.instant('ptd.assign_period_2_group_success'));
          this.dialogRef.close();
        },
        error: (error : any) => {
          this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_update_assign_period_spaces'));
        },
      });
    } else {
      this.popUpManager.showErrorAlert(this.translate.instant('ptd.alerta_campos_preasignacion'));
    }
  }

}
