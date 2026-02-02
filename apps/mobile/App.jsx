import React from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>KusinaKonek</Text>
      <Text style={styles.subtitle}>Community-driven food redistribution</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  title: {
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    color: "#4B5563"
  }
});
