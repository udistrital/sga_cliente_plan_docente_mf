import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable()
export class SgaEspaciosAcademicosMidService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('SGA_ESPACIOS_ACADEMICOS_MID_SERVICE');
    }
    get(endpoint: string) {
        this.requestManager.setPath('SGA_ESPACIOS_ACADEMICOS_MID_SERVICE');
        return this.requestManager.get(endpoint);
    }

    post(endpoint: string, element: any) {
        this.requestManager.setPath('SGA_ESPACIOS_ACADEMICOS_MID_SERVICE');
        return this.requestManager.post(endpoint, element);
    }

    put(endpoint: string, element: any) {
        this.requestManager.setPath('SGA_ESPACIOS_ACADEMICOS_MID_SERVICE');
        return this.requestManager.put(endpoint, element);
    }

    delete(endpoint: string, element: any) {
        this.requestManager.setPath('SGA_ESPACIOS_ACADEMICOS_MID_SERVICE');
        return this.requestManager.delete(endpoint, element.Id);
    }
}
