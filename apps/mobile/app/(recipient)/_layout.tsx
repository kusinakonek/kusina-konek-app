import { Stack } from "expo-router";

export default function RecipientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 300,
      }}>
      <Stack.Screen
        name="browse-food"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="all-recent-foods"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
