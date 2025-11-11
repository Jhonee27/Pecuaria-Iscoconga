import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {
  private apiUrl = 'http://localhost:3000/api/merchants'; // <-- asegúrate que sea la URL correcta

  constructor(private http: HttpClient) {}

  getMerchants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addMerchant(merchant: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, merchant);
  }
}
