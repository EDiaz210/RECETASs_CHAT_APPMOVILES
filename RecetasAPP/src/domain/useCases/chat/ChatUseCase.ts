import { supabase } from "@/src/data/services/supabaseClient";
import { Mensaje, EventoEscritura } from "../../models/Mensaje";
import { RealtimeChannel } from "@supabase/supabase-js";

export class ChatUseCase {
  private channel: RealtimeChannel | null = null;
  private typingChannel: RealtimeChannel | null = null; // ✅ AGREGADO

  // Obtener mensajes históricos
  async obtenerMensajes(limite: number = 50): Promise<Mensaje[]> {
    try {
      const { data, error } = await supabase
        .from("mensajes")
        .select(`
          *,
          usuarios!fk_usuario(email, rol)
        `)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) {
        console.error("Error al obtener mensajes:", error);
        throw error;
      }

      const mensajesFormateados = (data || []).map((msg: any) => ({
        ...msg,
        usuario: msg.usuarios,
      }));

      return mensajesFormateados.reverse() as Mensaje[];
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      return [];
    }
  }

  // Enviar un nuevo mensaje
  async enviarMensaje(
    contenido: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { error } = await supabase.from("mensajes").insert({
        contenido,
        usuario_id: user.id,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  // Suscribirse a nuevos mensajes en tiempo real
  suscribirseAMensajes(callback: (mensaje: Mensaje) => void) {
    this.channel = supabase.channel("mensajes-channel");

    this.channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
        },
        async (payload) => {
          console.log("📨 Nuevo mensaje recibido!", payload.new);

          try {
            const { data, error } = await supabase
              .from("mensajes")
              .select(`
                *,
                usuarios!fk_usuario(email, rol)
              `)
              .eq("id", payload.new.id)
              .single();

            if (error) {
              console.error("⚠️ Error al obtener mensaje completo:", error);

              const mensajeFallback: Mensaje = {
                id: payload.new.id,
                contenido: payload.new.contenido,
                usuario_id: payload.new.usuario_id,
                created_at: payload.new.created_at,
                usuario: {
                  email: "Desconocido",
                  rol: "usuario",
                },
              };

              console.log("🔄 Usando mensaje fallback");
              callback(mensajeFallback);
              return;
            }

            if (data) {
              const mensajeFormateado: Mensaje = {
                id: data.id,
                contenido: data.contenido,
                usuario_id: data.usuario_id,
                created_at: data.created_at,
                usuario: data.usuarios || {
                  email: "Desconocido",
                  rol: "usuario",
                },
              };

              callback(mensajeFormateado);
            }
          } catch (err) {
            console.error("❌ Error inesperado:", err);

            const mensajeFallback: Mensaje = {
              id: payload.new.id,
              contenido: payload.new.contenido,
              usuario_id: payload.new.usuario_id,
              created_at: payload.new.created_at,
              usuario: {
                email: "Desconocido",
                rol: "usuario",
              },
            };

            callback(mensajeFallback);
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado de suscripción:", status);
      });

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // ✅ NUEVO: Notificar que el usuario está escribiendo
  async notificarEscribiendo(email: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !this.typingChannel) return;

      // Enviar evento de escritura por el canal
      await this.typingChannel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          usuario_id: user.id,
          usuario_email: email,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error al notificar escritura:", error);
    }
  }

  // ✅ NUEVO: Suscribirse a eventos de escritura
  suscribirseAEscritura(callback: (evento: EventoEscritura) => void) {
    this.typingChannel = supabase.channel("typing-channel");

    this.typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        console.log("✍️ Usuario escribiendo:", payload);
        callback(payload as EventoEscritura);
      })
      .subscribe((status) => {
        console.log("Estado de suscripción typing:", status);
      });

    return () => {
      if (this.typingChannel) {
        supabase.removeChannel(this.typingChannel);
        this.typingChannel = null;
      }
    };
  }

  // Eliminar un mensaje
  async eliminarMensaje(
    mensajeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("mensajes")
        .delete()
        .eq("id", mensajeId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("Error al eliminar mensaje:", error);
      return { success: false, error: error.message };
    }
  }
}