import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthService } from './auth.service';

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'personal';
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'admin' | 'personal';
  password?: string;
}

// Interfaz para la respuesta de la API
interface ApiUser {
  id: number;
  email: string;
  role: 'admin' | 'personal';
  password?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<ApiUser[]>(this.apiUrl, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(apiUsers => apiUsers.map(apiUser => this.mapApiUserToUser(apiUser)))
    );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<ApiUser>(`${this.apiUrl}/${userId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(apiUser => this.mapApiUserToUser(apiUser))
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<ApiUser>(this.apiUrl, userData, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(apiUser => this.mapApiUserToUser(apiUser))
    );
  }

  updateUser(userId: number, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<ApiUser>(`${this.apiUrl}/${userId}`, userData, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(apiUser => this.mapApiUserToUser(apiUser))
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  private mapApiUserToUser(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      role: apiUser.role,
      created_at: apiUser.created_at,
      updated_at: apiUser.updated_at
    };
  }
}