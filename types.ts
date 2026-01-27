
export interface Articulo {
  id: string;
  clienteId: string;
  clienteNombre: string;
  codigoCliente: string;
  codigoInterno: string;
  ordenes: string[];
  fechaCreacion: string;
  ultimaActualizacion?: string;
  descripcionIA?: string;
}

export interface FormDataState {
  clienteId: string;
  clienteNombreManual: string;
  codigoInterno: string;
  codigoCliente: string;
  ordenFabricacion: string;
}

export interface Cliente {
  id: string;
  nombre: string;
}
