import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const COLORS: Record<string, string> = {
  like: "#9610FF",
  nope: "#F75555",
};

interface ChoiceProps {
  type: keyof typeof COLORS; // Ensures 'type' is either 'like' or 'nope'
}

const Choice: React.FC<ChoiceProps> = ({ type }) => {
  const color = COLORS[type];

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Text style={[styles.text, { color: color }]}>{type}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 7,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,.2)",
  },
  text: {
    fontSize: 48,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 4,
  },
});

export default Choice;
