import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useChat } from "@/src/presentation/hooks/useChat";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { Mensaje } from "@/src/domain/models/Mensaje";

export default function ChatScreen() {
  const {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    notificarEscribiendo,
    usuariosEscribiendo,
  } = useChat();
  const { usuario } = useAuth();
  const [textoMensaje, setTextoMensaje] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (mensajes.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [mensajes]);

  // ✅ NUEVO: Manejar cambios en el input
  const handleCambioTexto = (texto: string) => {
    setTextoMensaje(texto);

    // Notificar que estoy escribiendo
    if (texto.trim()) {
      notificarEscribiendo();

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Enviar notificación cada 1 segundo mientras escribo
      timeoutRef.current = setTimeout(() => {
        if (texto.trim()) {
          notificarEscribiendo();
        }
      }, 1000);
    }
  };

  const handleEnviar = async () => {
    if (!textoMensaje.trim() || enviando) return;

    const mensaje = textoMensaje;
    setTextoMensaje("");

    const resultado = await enviarMensaje(mensaje);

    if (!resultado.success) {
      alert("Error: " + resultado.error);
      setTextoMensaje(mensaje);
    }
  };

  const renderMensaje = ({ item }: { item: Mensaje }) => {
    const esMio = item.usuario_id === usuario?.id;
    const emailUsuario = item.usuario?.email || "Usuario desconocido";

    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeMio : styles.mensajeOtro,
        ]}
      >
        {!esMio && <Text style={styles.nombreUsuario}>{emailUsuario}</Text>}
        <Text
          style={[
            styles.contenidoMensaje,
            esMio && styles.contenidoMensajeMio,
          ]}
        >
          {item.contenido}
        </Text>
        <Text style={[styles.horaMensaje, esMio && styles.horaMensajeMio]}>
          {new Date(item.created_at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  // ✅ NUEVO: Componente de indicador de escritura
  const IndicadorEscritura = () => {
    const animacion1 = useRef(new Animated.Value(0)).current;
    const animacion2 = useRef(new Animated.Value(0)).current;
    const animacion3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animarPuntos = () => {
        Animated.sequence([
          Animated.timing(animacion1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animacion2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animacion3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(animacion1, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(animacion2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(animacion3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animarPuntos());
      };

      animarPuntos();
    }, []);

    if (usuariosEscribiendo.length === 0) return null;

    const nombresUsuarios = usuariosEscribiendo
      .map((u) => u.usuario_email.split("@")[0])
      .join(", ");

    return (
      <View style={styles.indicadorContainer}>
        <Text style={styles.indicadorTexto}>
          {usuariosEscribiendo.length === 1
            ? `${nombresUsuarios} está escribiendo`
            : `${nombresUsuarios} están escribiendo`}
        </Text>
        <View style={styles.puntosContainer}>
          <Animated.View
            style={[
              styles.punto,
              {
                opacity: animacion1,
                transform: [
                  {
                    translateY: animacion1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.punto,
              {
                opacity: animacion2,
                transform: [
                  {
                    translateY: animacion2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.punto,
              {
                opacity: animacion3,
                transform: [
                  {
                    translateY: animacion3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.textoCargando}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* ✅ NUEVO: Mostrar indicador de escritura */}
      <IndicadorEscritura />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={textoMensaje}
          onChangeText={handleCambioTexto}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.botonEnviar,
            (!textoMensaje.trim() || enviando) && styles.botonDeshabilitado,
          ]}
          onPress={handleEnviar}
          disabled={!textoMensaje.trim() || enviando}
        >
          <Text style={styles.textoBotonEnviar}>
            {enviando ? "..." : "Enviar"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  mensajeContainer: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  mensajeMio: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  mensajeOtro: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  nombreUsuario: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  contenidoMensaje: {
    fontSize: 16,
    color: "#000",
  },
  contenidoMensajeMio: {
    color: "#FFF",
  },
  horaMensaje: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  horaMensajeMio: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  // ✅ NUEVO: Estilos del indicador de escritura
  indicadorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  indicadorTexto: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginRight: 8,
  },
  puntosContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007AFF",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 16,
  },
  botonEnviar: {
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    justifyContent: "center",
  },
  botonDeshabilitado: {
    backgroundColor: "#CCC",
  },
  textoBotonEnviar: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});