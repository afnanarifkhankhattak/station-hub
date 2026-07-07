import React from 'react';
import { View, Text } from 'react-native';

export default function MapView(props) {
  return (
    <View style={[props.style, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#666' }}>Map is not supported on Web</Text>
    </View>
  );
}
