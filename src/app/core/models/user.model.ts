export interface User {
  id?: number;
  email: string;
  role: 'admin' | 'personal';
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}