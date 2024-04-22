import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DocumentoService } from './documento.service';
import { RequestManager } from '../managers/requestManager';
import { Subject } from 'rxjs';
import { HttpEventType } from '@angular/common/http';

@Injectable()
export class GestorDocumentalService {
    private documentsList: any[] = [];

    private mimeTypes: { [tipoMIME: string]: string } = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "text/plain": ".txt",
        "text/html": ".html",
        "text/css": ".css",
        "text/javascript": ".js",
        "application/json": ".json",
        "application/xml": ".xml"
    };

    // ? list from: https://www.garykessler.net/library/file_sigs.html
    private fileSignatures: { [tipoMIME: string]: string[] } = {
        "image/jpeg": ["FFD8", "FFD8FF", "464946", "696600"],
        "image/png": ["89504E47"],
        "image/gif": ["47494638"],
        "image/bmp": ["424D"],
        "image/webp": ["52494646", "57454250"],
        "image/svg+xml": ["3C737667"],
        "application/pdf": ["25504446", "255044462D"],
        "application/msword": ["D0CF11E0A1B11AE1"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["504B0304", "504B030414000600"],
        "application/vnd.ms-excel": ["D0CF11E0A1B11AE1"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["504B0304", "504B030414000600"],
        "application/vnd.ms-powerpoint": ["D0CF11E0A1B11AE1"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["504B0304", "504B030414000600"],
        "none": []
        // Text,HTML,CSS,JavaScript,JSON,XML files don't have a unique signature
    };

    constructor(
        private requestManager: RequestManager,
        private sanitization: DomSanitizer,
        private documentService: DocumentoService,
    ) { }

    readVerifyMimeType(file: File): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer.slice(0, 8));
                const mime = Array.from(uint8Array).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
                const extension = file.type || "none";
                resolve(this.fileSignatures[extension].some(sign => mime.startsWith(sign)))
            };
            reader.onerror = () => resolve(false)
            reader.readAsArrayBuffer(file)
        });
    }

    clearLocalFiles() {
        this.documentsList = [];
    }

    getUrlFile(base64: string, minetype: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const url = `data:${minetype};base64,${base64}`;
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "File name", { type: minetype })
                    const url = URL.createObjectURL(file);
                    resolve(url);
                }).catch(err => reject(err));
        });
    }

    fileToBase64(file: Blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '');
                if (encoded === undefined) {
                    reject(new Error('Could not read file'));
                } else if ((encoded.length % 4) > 0) {
                    encoded += '='.repeat(4 - (encoded.length % 4));
                }
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    }

    getManyFiles(query: string) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
        this.requestManager.getp('/document' + query).subscribe(
            async (response: any) => {
                if (response.type === HttpEventType.DownloadProgress) {
                    const downloadProgress = 100 * response.loaded / response.total;
                    documentsSubject.next({ "downloadProgress": downloadProgress });
                }
                if (response.type === HttpEventType.Response) {
                    let listaDocsRaw = <Array<any>>response.body.Data;
                    let listaDocs = await Promise.all(listaDocsRaw.map(async doc => {
                        if (doc.Nuxeo) {
                            return {
                                Id: doc.Id,
                                Nombre: doc.Nombre,
                                Enlace: doc.Enlace,
                                Url: await this.getUrlFile(doc.Nuxeo.file, doc.Nuxeo['file:content']['mime-type']),
                                TipoArchivo: this.mimeTypes[doc.Nuxeo['file:content']['mime-type']],
                            }
                        } else {
                            return {}
                        }
                    }));
                    this.documentsList.push(...listaDocs);
                    documentsSubject.next(listaDocs);
                }
            },
            (error: any) => {
                documentsSubject.error(error)
            }
        );
        return documents$;
    }

    getByIdLocal(id: number) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        const doc = this.documentsList.find(doc => doc.Id === id);
        if (doc != undefined) {
            setTimeout(() => {
                documentsSubject.next({ "Id": doc.Id, "nombre": doc.Nombre, "url": doc.Url, "type": doc.TipoArchivo });
            }, 1);
        } else {
            documentsSubject.error("Document not found");
        }
        return documents$
    }

    uploadFiles(files: any[]) {
        const documentsSubject = new Subject<any[]>();
        const documents$ = documentsSubject.asObservable();

        const documentos: any[] = [];

        files.map(async (file) => {
            const sendFileData = [{
                IdTipoDocumento: file.IdDocumento,
                nombre: file.nombre.replace(/[\.]/g),
                metadatos: file.metadatos ? file.metadatos : {},
                descripcion: file.descripcion ? file.descripcion : "",
                file: await this.fileToBase64(file.file)
            }]
            this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
            this.requestManager.post('/document/uploadAnyFormat', sendFileData)
                .subscribe((dataResponse) => {
                    documentos.push(dataResponse);
                    if (documentos.length === files.length) {
                        documentsSubject.next(documentos);
                    }
                })
        });

        return documents$;
    }

    uploadFilesElectronicSign(files: Array<any>) {
        const documentsSubject = new Subject<any[]>();
        const documents$ = documentsSubject.asObservable();

        const documentos: any[] = [];

        files.map(async (file) => {
            const sendFileDataandSigners = [{
                IdTipoDocumento: file.IdDocumento,
                nombre: file.nombre.replace(/[\.]/g),
                metadatos: file.metadatos ? file.metadatos : {},
                descripcion: file.descripcion ? file.descripcion : "",
                file: file.base64 ? file.base64 : await this.fileToBase64(file.file),
                firmantes: file.firmantes ? file.firmantes : [],
                representantes: file.representantes ? file.representantes : []
            }];
            this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
            this.requestManager.post('/document/firma_electronica', sendFileDataandSigners)
                .subscribe((dataResponse) => {
                    documentos.push(dataResponse);
                    if (documentos.length === files.length) {
                        documentsSubject.next(documentos);
                    }
                }, (error) => {
                    documentsSubject.error(error);
                })
        });

        return documents$
    }

    get(files: any[]) {
        const documentsSubject = new Subject<any[]>();
        const documents$ = documentsSubject.asObservable();
        const documentos = files;
        let i = 0;
        files.map((file, index) => {
            this.documentService.get('documento/' + file.Id)
                .subscribe((doc) => {
                    this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
                    this.requestManager.get('/document/' + doc.Enlace)
                        .subscribe(async (f: any) => {
                            const url = await this.getUrlFile(f.file, file.ContentType ? file.ContentType : f['file:content']['mime-type'])
                            documentos[index] = {
                                ...documentos[index], ...{ url: url }, ...{ Documento: this.sanitization.bypassSecurityTrustUrl(url) },
                                ...{ Nombre: doc.Nombre }, ...{ Metadatos: doc.Metadatos }
                            }
                            i += 1;
                            if (i === files.length) {
                                documentsSubject.next(documentos);
                            }
                        })
                })
        });
        return documents$;
    }

    getByUUID(uuid: string) {
        const documentsSubject = new Subject<string>();
        const documents$ = documentsSubject.asObservable();
        let documento = null;
        this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
        this.requestManager.get('/document/' + uuid)
            .subscribe(async (f: any) => {
                const url = await this.getUrlFile(f.file, f['file:content']['mime-type']);
                documento = url
                documentsSubject.next(documento);
            }, (error) => {
                documentsSubject.next(error);
            })
        return documents$;
    }

    deleteByUUID(uuid: string) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        const versionar = true;
        this.requestManager.setPath('GESTOR_DOCUMENTAL_MID_SERVICE');
        this.requestManager.delete('/document/', uuid + '?versionar=' + versionar)
            .subscribe(r => {
                documentsSubject.next(r)
            }, e => {
                documentsSubject.error(e)
            })
        return documents$;
    }

    deleteByIdDoc(Id: number, relacion: any) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        this.documentService.get('documento/' + Id).subscribe((doc: any) => {
            doc.Activo = false;
            doc.Descripcion = "id_relacionado: " + relacion;
            this.documentService.put('documento/', doc).subscribe((doc: any) => {
                documentsSubject.next(doc)
            }, e => {
                documentsSubject.error(e)
            })
        }, e => {
            documentsSubject.error(e)
        });
        return documents$;
    }
}