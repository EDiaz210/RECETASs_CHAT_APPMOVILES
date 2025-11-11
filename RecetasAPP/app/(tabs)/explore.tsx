import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";

export default function NuevaRecetaScreen() {
  const { esChef } = useAuth();
  const router = useRouter();

  const handleIrACrear = () => {
    router.push("/recipe/crear");
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <Text style={globalStyles.title}>Nueva Receta</Text>

        {esChef ? (
          <View style={styles.contenido}>
            <Text style={styles.descripcion}>
              ¿Listo para compartir una nueva receta con la comunidad? 👨‍🍳
            </Text>
            <Text style={globalStyles.textSecondary}>
              Agrega título, descripción, ingredientes y una foto opcional.
            </Text>

            <TouchableOpacity
              style={[
                globalStyles.button,
                globalStyles.buttonPrimary,
                styles.botonCrear,
              ]}
              onPress={handleIrACrear}
            >
              <Text style={globalStyles.buttonText}>✨ Crear Receta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contenido}>
            <Text style={styles.noChef}>👤 Usuario Regular</Text>
            <Text style={globalStyles.textSecondary}>
              Esta sección es exclusiva para chefs. Los usuarios regulares
              pueden ver y buscar recetas desde la pestaña Home.
            </Text>
            <Text style={[globalStyles.textSecondary, styles.nota]}>
              💡 Si quieres publicar recetas, crea una cuenta de chef.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    marginTop: spacing.lg,
  },
  descripcion: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: "500",
  },
  botonCrear: {
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  noChef: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  nota: {
    marginTop: spacing.lg,
    fontStyle: "italic",
  },
});