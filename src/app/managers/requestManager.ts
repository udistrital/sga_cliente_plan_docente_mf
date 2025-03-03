import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorManager } from './errorManager'

/**
 * This class manage the http connections with internal REST services. Use the response format {
 *  Code: 'xxxxx',
 *  Body: 'Some Data' (this element is returned if the request is success)
 *  ...
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class RequestManager {
  private path: string = "";
  public httpOptions: any;
  constructor(private http: HttpClient, private errManager: HttpErrorManager) {
    const acces_token = window.localStorage.getItem('access_token');
    if (acces_token !== null) {
      this.httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${acces_token}`,
        }),
      }
    }
  }


  /**
   * Use for set the source path of the service (service's name must be present at src/environment/environment.ts)
   * @param service: string
   */
  public setPath(service: string) {
    this.path = <string>environment[service as keyof typeof environment];
  }


  /**
   * Perform a GET http request
   * @param endpoint service's end-point
   * @param params (an Key, Value object with que query params for the request)
   * @returns Observable<any>
   */
  get(endpoint: string) {
    return this.http.get<any>(`${this.path}${endpoint}`, this.httpOptions).pipe(
      map(
        (res) => {
          if (res instanceof HttpResponse) {
            return res.body;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError.bind(this)),
    );
  }

  getp(endpoint: string) {
    return this.http.get<any>(`${this.path}${endpoint}`, {...this.httpOptions, reportProgress: true, observe: 'events' }).pipe(
      catchError(this.errManager.handleError.bind(this)),
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(endpoint: string, element: any) {
    return this.http.post<any>(`${this.path}${endpoint}`, element, this.httpOptions).pipe(
      map(
        (res) => {
          if (res instanceof HttpResponse) {
            return res.body;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post_file(endpoint: string, element: any) {
    return this.http.post<any>(`${this.path}${endpoint}`, element, {
      headers: new HttpHeaders({
        'Content-Type': 'multipart/form-data',
      })
    }).pipe(
      map(
        (res) => {
          if (res instanceof HttpResponse) {
            return res.body;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a PUT http request
   * @param endpoint service's end-point
   * @param element data to send as JSON, With the id to UPDATE
   * @returns Observable<any>
   */
  put(endpoint: string, element: any) {
    const path = (element.Id) ? `${this.path}${endpoint}/${element.Id}` : `${this.path}${endpoint}`;
    return this.http.put<any>(path, element, this.httpOptions).pipe(
      map(
        (res) => {
          if (res instanceof HttpResponse) {
            return res.body;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a DELETE http request
   * @param endpoint service's end-point
   * @param id element's id for remove
   * @returns Observable<any>
   */
  delete(endpoint: string, id: number | string) {
    return this.http.delete<any>(`${this.path}${endpoint}/${id}`, this.httpOptions).pipe(
      map(
        (res) => {
          if (res instanceof HttpResponse) {
            return res.body;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError),
    );
  }
};
