export interface Mensaje {
  id: string;
  contenido: string;
  usuario_id: string;
  created_at: string;
  // Información del usuario (join)
  usuario?: {
    email: string;
    rol: string;
  };
}

// ✅ NUEVO: Modelo para eventos de escritura
export interface EventoEscritura {
  usuario_id: string;
  usuario_email: string;
  timestamp: number;
}.