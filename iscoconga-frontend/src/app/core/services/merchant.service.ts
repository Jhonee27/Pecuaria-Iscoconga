import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private apiUrl = `${environment.apiUrl}/merchants`;

  constructor(private http: HttpClient) {}

  getMerchants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addMerchant(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateMerchant(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteMerchant(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
