import { Stack } from "expo-router";

export default function RecipientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}>
      <Stack.Screen name="browse-food" />
    </Stack>
  );
}
