// src/app/shared/pipes/format-date.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true
})
export class FormatDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

}
