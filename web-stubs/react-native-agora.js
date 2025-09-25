// Mobile stub for react-native-agora - prevents TurboModule errors
import React from 'react';
import { View } from 'react-native';

// Dummy RtcEngine class
class RtcEngine {
  static create() {
    return new RtcEngine();
  }
  
  async initialize() {
    return Promise.resolve();
  }
  
  async joinChannel() {
    return Promise.resolve();
  }
  
  async leaveChannel() {
    return Promise.resolve();
  }
  
  async destroy() {
    return Promise.resolve();
  }
  
  addListener() {
    return () => {}; // Return unsubscribe function
  }
  
  removeAllListeners() {
    return Promise.resolve();
  }
}

// Dummy RtcSurfaceView component
const RtcSurfaceView = React.forwardRef((props, ref) => {
  return React.createElement(View, { 
    ...props, 
    ref,
    style: [props.style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }] 
  });
});

// Dummy constants
const ChannelProfileType = {
  Communication: 0,
  LiveBroadcasting: 1,
};

const ClientRoleType = {
  Broadcaster: 1,
  Audience: 2,
};

// Default export
export default RtcEngine;

// Named exports
export { RtcSurfaceView, ChannelProfileType, ClientRoleType };

