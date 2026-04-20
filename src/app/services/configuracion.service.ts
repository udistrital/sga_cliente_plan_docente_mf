import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('CONFIGURACION_SERVICE');
    }
    get(endpoint: string) {
        this.requestManager.setPath('CONFIGURACION_SERVICE');
        return this.requestManager.get(endpoint);
    }
}
