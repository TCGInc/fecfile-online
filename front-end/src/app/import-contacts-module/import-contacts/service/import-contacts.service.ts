import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImportContactsService {

  constructor(private _http: HttpClient) { }

  public getDuplicates(page: number) {
    let httpOptions = new HttpHeaders();
    httpOptions = httpOptions.append('Content-Type', 'application/json');
    const params = new HttpParams();

    // TODO even pages return diff data just for change detection development - romve it when api is ready
    if (page % 2 === 0) {
      // TODO Using mock server data until API is integrated
      return this._http
        .get('assets/mock-data/import-contacts/duplicates_even.json', {
          headers: httpOptions,
          params
        })
        .pipe(
          map(res => {
            if (res) {
              return res;
            }
            return false;
          })
        );
    } else {
      // TODO Using mock server data until API is integrated
      return this._http
        .get('assets/mock-data/import-contacts/duplicates.1.json', {
          headers: httpOptions,
          params
        })
        .pipe(
          map(res => {
            if (res) {
              return res;
            }
            return false;
          })
        );
    }
  }

}
