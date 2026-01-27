
import { Articulo } from '../types';
import { APP_STORAGE_KEY } from '../constants';

export const storageService = {
  getArticulos: (): Articulo[] => {
    const data = localStorage.getItem(APP_STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing stored data", e);
      return [];
    }
  },

  saveArticulos: (articulos: Articulo[]): void => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(articulos));
  },

  addArticulo: (articulo: Omit<Articulo, 'id' | 'fechaCreacion'>): Articulo => {
    const articulos = storageService.getArticulos();
    const newArticulo: Articulo = {
      ...articulo,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString()
    };
    storageService.saveArticulos([newArticulo, ...articulos]);
    return newArticulo;
  },

  updateArticulo: (id: string, updates: Partial<Articulo>): Articulo | null => {
    const articulos = storageService.getArticulos();
    const index = articulos.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updated = { 
      ...articulos[index], 
      ...updates, 
      ultimaActualizacion: new Date().toISOString() 
    };
    articulos[index] = updated;
    storageService.saveArticulos(articulos);
    return updated;
  },

  deleteArticulo: (id: string): void => {
    const articulos = storageService.getArticulos();
    const filtered = articulos.filter(a => a.id !== id);
    storageService.saveArticulos(filtered);
  }
};
