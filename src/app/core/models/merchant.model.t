export interface Merchant {
  id?: number;
  name: string;
  dni?: string;
  ruc?: string;
  address?: string;
  status: 'habilitado' | 'pendiente' | 'suspendido';
  created_at?: string;
  updated_at?: string;
  trucks?: Truck[];
  movements?: Movement[];
}

export interface MerchantForm {
  name: string;
  dni?: string;
  ruc?: string;
  address?: string;
  status?: 'habilitado' | 'pendiente' | 'suspendido';
}