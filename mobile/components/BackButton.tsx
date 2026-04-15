import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  fallback?: string;
};

export default function BackButton({ fallback = "/(app)/_tabs" }: Props) {
  const router = useRouter(); // ✅ correct

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
    console.log("canGoBack:", router.canGoBack());
  };

  return (
    <Pressable style={styles.container} onPress={handleBack}>
      <Ionicons name="arrow-back" size={22} color={colors.primary} />
      <Text style={styles.text}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  text: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
});
