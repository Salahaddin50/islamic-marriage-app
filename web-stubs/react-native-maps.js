// Web stub for react-native-maps
import React from 'react';
import { View } from 'react-native';

// Dummy MapView component for web
const MapView = React.forwardRef((props, ref) => {
  return React.createElement(View, { 
    ...props, 
    ref,
    style: [props.style, { backgroundColor: '#f0f0f0' }] 
  });
});

// Dummy Marker component
const Marker = ({ children, ...props }) => {
  return React.createElement(View, props, children);
};

// Dummy Callout component  
const Callout = ({ children, ...props }) => {
  return React.createElement(View, props, children);
};

// Default export
export default MapView;

// Named exports
export { Marker, Callout };
