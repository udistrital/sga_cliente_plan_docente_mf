import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfiguracionService } from '../services/configuracion.service';

@Injectable({
  providedIn: 'root'
})
export class PermisosUtils {

  constructor(private configuracionService: ConfiguracionService) {}

  /**
   * Verifica si los roles tienen permiso sobre una opción
   */
  tienePermiso(roles: string[], nombreOpcion: string): Observable<boolean> {

    const endpoint = `perfil_x_menu_opcion?limit=-1&query=Opcion__Nombre:${nombreOpcion},Perfil__Nombre__in:${roles.join('|')}`;

    return this.configuracionService.get(endpoint).pipe(
      map((response: any) => {
        const data = response?.Data || response;
        return Array.isArray(data) && data.length > 0;
      })
    );
  }
}