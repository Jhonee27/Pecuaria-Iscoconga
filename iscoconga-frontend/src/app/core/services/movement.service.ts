import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MovementItem {
  category?: 'ganado' | 'vehículo' | 'cochera';
  species?: string;  // Alternativa a category
  type?: string;
  breed?: string;
  note?: string;
  qty_in: number;
  unit_price: number;
  subtotal: number;
}

export interface Movement {
  id?: number; // 👈 agregado para mostrar en la tabla
  merchant_id: number;
  truck_id?: number;
  items: MovementItem[];
  total?: number;
  date?: string;
  vendor?: string;
  expanded?: boolean; // 👈 agregado para manejar expansión del detalle
}

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private apiUrl = `${environment.apiUrl}/movements`;

  constructor(private http: HttpClient) { }

  createMovement(movement: Movement): Observable<any> {
    return this.http.post(this.apiUrl, movement);
  }

  getMovements(): Observable<Movement[]> {
    return this.http.get<Movement[]>(this.apiUrl);
  }
}
