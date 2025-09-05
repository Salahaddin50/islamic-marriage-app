import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Import Agora SDK
import {
  RtcEngine,
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
  ChannelProfile,
  ClientRole,
} from 'react-native-agora';

import { AGORA_APP_ID, AGORA_TEMP_TOKEN } from '../src/config/agora';
import { AgoraTokenService } from '../src/services/agora-token.service';

export default function CallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const channelId = params.channel as string || 'test-channel';
  
  const [engine, setEngine] = useState<RtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const callStartTime = useRef<number>(Date.now());
  const durationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initAgora();
    return () => {
      cleanup();
    };
  }, []);

  // Update call duration every second
  useEffect(() => {
    if (joined) {
      durationInterval.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [joined]);

  const initAgora = async () => {
    try {
      // Create RTC engine
      const rtcEngine = await RtcEngine.create(AGORA_APP_ID);
      setEngine(rtcEngine);

      // Enable video
      await rtcEngine.enableVideo();
      await rtcEngine.enableAudio();

      // Set channel profile
      await rtcEngine.setChannelProfile(ChannelProfile.Communication);
      await rtcEngine.setClientRole(ClientRole.Broadcaster);

      // Add event listeners
      rtcEngine.addListener('UserJoined', (uid) => {
        console.log('UserJoined', uid);
        setRemoteUid(uid);
      });

      rtcEngine.addListener('UserOffline', (uid) => {
        console.log('UserOffline', uid);
        setRemoteUid(null);
      });

      rtcEngine.addListener('JoinChannelSuccess', (channel, uid) => {
        console.log('JoinChannelSuccess', channel, uid);
        setJoined(true);
        callStartTime.current = Date.now();
      });

      rtcEngine.addListener('Error', (error) => {
        console.log('Agora Error:', error);
        Alert.alert('Call Error', 'There was an issue with the video call.');
      });

      // Get token from server (for production) or use temp token (for development)
      let token = AGORA_TEMP_TOKEN;
      
      try {
        // Try to get token from server first
        const tokenData = await AgoraTokenService.generateToken(channelId);
        token = tokenData.token;
        console.log('Using server-generated token');
      } catch (tokenError) {
        console.warn('Failed to get server token, using temp token:', tokenError);
        // Fallback to temp token for development
      }

      // Join channel
      await rtcEngine.joinChannel(token, channelId, null, 0);
      
    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      Alert.alert('Error', 'Failed to start video call. Please try again.');
    }
  };

  const cleanup = async () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    if (engine) {
      await engine.leaveChannel();
      await engine.destroy();
      setEngine(null);
    }
  };

  const endCall = async () => {
    await cleanup();
    router.back();
  };

  const toggleVideo = async () => {
    if (engine) {
      await engine.enableLocalVideo(!localVideoEnabled);
      setLocalVideoEnabled(!localVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (engine) {
      await engine.enableLocalAudio(!localAudioEnabled);
      setLocalAudioEnabled(!localAudioEnabled);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!joined) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connecting to call...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Remote video view */}
      <View style={styles.remoteVideoContainer}>
        {remoteUid ? (
          <RtcRemoteView.SurfaceView
            style={styles.remoteVideo}
            uid={remoteUid}
            channelId={channelId}
            renderMode={VideoRenderMode.Hidden}
          />
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Waiting for other participant...</Text>
          </View>
        )}
      </View>

      {/* Local video view */}
      <View style={styles.localVideoContainer}>
        {localVideoEnabled ? (
          <RtcLocalView.SurfaceView
            style={styles.localVideo}
            channelId={channelId}
            renderMode={VideoRenderMode.Hidden}
          />
        ) : (
          <View style={[styles.localVideo, styles.videoDisabled]}>
            <Ionicons name="videocam-off" size={24} color={COLORS.white} />
          </View>
        )}
      </View>

      {/* Call duration */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
      </View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, !localAudioEnabled && styles.controlButtonDisabled]}
          onPress={toggleAudio}
        >
          <MaterialCommunityIcons 
            name={localAudioEnabled ? "microphone" : "microphone-off"} 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !localVideoEnabled && styles.controlButtonDisabled]}
          onPress={toggleVideo}
        >
          <Ionicons 
            name={localVideoEnabled ? "videocam" : "videocam-off"} 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'regular',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  remoteVideo: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  localVideo: {
    flex: 1,
  },
  videoDisabled: {
    backgroundColor: COLORS.greyscale700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'medium',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  endCallButton: {
    backgroundColor: '#FF4444',
  },
});


