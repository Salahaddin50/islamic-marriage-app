import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Linking, Alert, Modal, Vibration } from 'react-native';
import { COLORS, SIZES, images, icons } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MeetService, MeetRecord } from '@/src/services/meet';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { AGORA_APP_ID } from '@/src/config/agora';
import AcceptConfirmationModal from '@/components/AcceptConfirmationModal';

const MeetRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const isFocused = useIsFocused();
  const [incoming, setIncoming] = useState<MeetRecord[]>([]);
  const [outgoing, setOutgoing] = useState<MeetRecord[]>([]);
  const [approved, setApproved] = useState<MeetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: 'Received (0)' },
    { key: 'sent', title: 'Sent (0)' },
    { key: 'approved', title: 'Approved (0)' },
  ]);

  const [profilesById, setProfilesById] = useState<Record<string, { name: string; age?: number; avatar?: any }>>({});
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const CACHE_KEY = 'hume_meet_requests_cache_v1';

  // Storage utility
  const Storage = {
    async setItem(key: string, value: string) {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    },
    async getItem(key: string): Promise<string | null> {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    },
  };
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [showJoinInfoModal, setShowJoinInfoModal] = useState(false);
  const [selectedMeetRow, setSelectedMeetRow] = useState<MeetRecord | null>(null);
  const [showJitsiModal, setShowJitsiModal] = useState(false);
  const [jitsiHtml, setJitsiHtml] = useState<string | null>(null);
  const [showWebCallModal, setShowWebCallModal] = useState(false);
  const [webCallHtml, setWebCallHtml] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string>('');
  const [showRingModal, setShowRingModal] = useState(false);
  const [ringMeetRow, setRingMeetRow] = useState<MeetRecord | null>(null);
  const [ringDismissedIds, setRingDismissedIds] = useState<Set<string>>(new Set());
  const [highlightMeetId, setHighlightMeetId] = useState<string | null>(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const [ringMuted, setRingMuted] = useState<boolean>(false);
  const ringAudioRef = React.useRef<any>(null);
  const ringNativeRef = React.useRef<any>(null);
  const RING_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-old-telephone-ring-135.mp3';
  const RING_MUTE_KEY = 'HUME_RING_MUTED';
  const WEB_SOUND_ENABLED_KEY = 'HUME_WEB_SOUND_ENABLED';
  const [webSoundEnabled, setWebSoundEnabled] = useState<boolean>(false);
  const [needSoundUnlock, setNeedSoundUnlock] = useState<boolean>(false);
  // WebAudio beep fallback (reliable on web)
  const ringCtxRef = React.useRef<any>(null);
  
  const calculateAge = (dateOfBirth?: string | null): number | undefined => {
    if (!dateOfBirth) return undefined;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Modal state for accept confirmation
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedMeetRequest, setSelectedMeetRequest] = useState<MeetRecord | null>(null);
  const ringGainRef = React.useRef<any>(null);
  const ringOscRef = React.useRef<any>(null);
  const ringBeepTimerRef = React.useRef<any>(null);
  
  // Call signaling state
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    channel: string;
    meetId: string;
  } | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState<{
    receiverId: string;
    receiverName: string;
    receiverAvatar?: string;
    channel: string;
    meetId: string;
  } | null>(null);

  const startWebBeep = (isOutgoing = false) => {
    try {
      if (Platform.OS !== 'web') return;
      if (ringCtxRef.current) return; // already running
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      try { if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); } } catch {}
      if (ctx.state !== 'running') {
        setNeedSoundUnlock(true);
        try { ctx.close(); } catch {}
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isOutgoing ? 350 : 440, ctx.currentTime); // Lower tone for outgoing
      gain.gain.setValueAtTime(0, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringCtxRef.current = ctx;
      ringGainRef.current = gain;
      ringOscRef.current = osc;
      
      if (isOutgoing) {
        // Outgoing call beep: short beeps like WhatsApp
        const pattern = () => {
          try {
            const now = ctx.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
            gain.gain.setValueAtTime(0.15, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          } catch {}
        };
        pattern();
        ringBeepTimerRef.current = setInterval(pattern, 1500);
      } else {
        // Incoming call ring: longer rings
        const pattern = () => {
          try {
            const now = ctx.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
            gain.gain.setValueAtTime(0.2, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
          } catch {}
        };
        pattern();
        ringBeepTimerRef.current = setInterval(pattern, 2000);
      }
    } catch {}
  };

  const stopWebBeep = () => {
    try {
      if (Platform.OS !== 'web') return;
      if (ringBeepTimerRef.current) { clearInterval(ringBeepTimerRef.current); ringBeepTimerRef.current = null; }
      if (ringOscRef.current) { try { ringOscRef.current.stop(); } catch {} ringOscRef.current = null; }
      if (ringCtxRef.current) { try { ringCtxRef.current.close(); } catch {} ringCtxRef.current = null; }
      ringGainRef.current = null;
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync(RING_MUTE_KEY);
        if (v === '1') setRingMuted(true);
        if (Platform.OS === 'web') {
          const s = (typeof window !== 'undefined') ? window.localStorage.getItem(WEB_SOUND_ENABLED_KEY) : null;
          if (s === null) {
            try { if (typeof window !== 'undefined') { window.localStorage.setItem(WEB_SOUND_ENABLED_KEY, '1'); } } catch {}
            setWebSoundEnabled(true); // default enabled
          } else {
            // treat any value other than '0' as enabled to be permissive
            setWebSoundEnabled(s !== '0');
          }
        }
      } catch {}
    })();
  }, []);

  // Blinking effect runs while any approved row is within the blink window
  useEffect(() => {
    const anyInWindow = approved?.some(r => isWithinBlinkWindow(r.scheduled_at));
    if (!anyInWindow) {
      setBlinkOn(false);
      return;
    }
    const id = setInterval(() => setBlinkOn(prev => !prev), 600);
    return () => clearInterval(id);
  }, [approved, nowTick]);

  const formatRequestTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (diffMs < oneDayMs) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    } catch {
      return iso;
    }
  };

  const PROFILES_CACHE_KEY = 'hume_profiles_cache_v1';

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    // 1) Read cache
    let cache: Record<string, { name: string; avatar?: any }> = {};
    try {
      const raw = await Storage.getItem(PROFILES_CACHE_KEY);
      if (raw) cache = JSON.parse(raw) || {};
    } catch {}

    const toFetch = uniqueIds.filter(id => !cache[id]);
    const map: Record<string, { name: string; avatar?: any }> = {};

    // 2) If missing, fetch from DB
    if (toFetch.length > 0) {
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, date_of_birth, profile_picture_url, gender')
        .in('user_id', toFetch);
    (data || []).forEach((row: any) => {
      const name = (row.first_name || 'Member').toString();
      map[row.user_id] = {
        name,
        age: calculateAge(row.date_of_birth),
        avatar: row.profile_picture_url
          ? row.profile_picture_url
          : (row.gender && typeof row.gender === 'string' && row.gender.toLowerCase() === 'female'
              ? images.femaleSilhouette
              : images.maleSilhouette),
      };
    });
      // merge into cache and persist
      const newCache = { ...cache, ...map };
      try { await Storage.setItem(PROFILES_CACHE_KEY, JSON.stringify(newCache)); } catch {}
      cache = newCache;
    }

    // 3) Merge cache entries for requested IDs into state
    uniqueIds.forEach(id => {
      const entry = cache[id];
      if (entry) map[id] = entry;
    });

    if (Object.keys(map).length > 0) setProfilesById(prev => ({ ...prev, ...map }));
  };

  const loadAll = async (isLoadMore: boolean = false) => {
    try {
      // ensure my user id for display logic
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setMyUserId(user?.id || null);
      } catch {}
      if (isLoadMore) {
        setIsFetchingMore(true);
      } else {
        // Load from cache first for instant render and avoid flashing the loading state
        let usedCache = false;
        try {
          const cached = await Storage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.incoming) setIncoming(parsed.incoming);
            if (parsed.outgoing) setOutgoing(parsed.outgoing);
            if (parsed.approved) setApproved(parsed.approved);
            if (parsed.profilesById) setProfilesById(parsed.profilesById);
            setLoading(false);
            usedCache = true;
          }
        } catch {}
        if (!usedCache && incoming.length === 0 && outgoing.length === 0 && approved.length === 0) {
        setLoading(true);
        }
      }
      
      const offset = isLoadMore ? (page + 1) * PAGE_SIZE : 0;
      const [inc, out, appr] = await Promise.all([
        MeetService.listIncoming({ limit: PAGE_SIZE, offset }),
        MeetService.listOutgoing({ limit: PAGE_SIZE, offset }),
        MeetService.listApproved({ limit: PAGE_SIZE, offset }),
      ]);
      
      if (isLoadMore) {
        setIncoming(prev => [...prev, ...inc]);
        setOutgoing(prev => [...prev, ...out]);
        setApproved(prev => [...prev, ...appr]);
        setPage(prev => prev + 1);
        setHasMore(inc.length === PAGE_SIZE || out.length === PAGE_SIZE || appr.length === PAGE_SIZE);
      } else {
        setIncoming(inc);
        setOutgoing(out);
        setApproved(appr);
        setPage(0);
        setHasMore(inc.length === PAGE_SIZE || out.length === PAGE_SIZE || appr.length === PAGE_SIZE);
      }
      
      const ids: string[] = [];
      inc.forEach(r => ids.push(r.sender_id));
      out.forEach(r => ids.push(r.receiver_id));
      appr.forEach(r => { ids.push(r.sender_id, r.receiver_id); });
      await loadProfiles(ids);
      
      // Cache for instant next load
      if (!isLoadMore) {
        try {
          await Storage.setItem(CACHE_KEY, JSON.stringify({
            incoming: inc, outgoing: out, approved: appr, profilesById
          }));
        } catch {}
      }
    } finally {
      if (isLoadMore) {
        setIsFetchingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleAcceptClick = (meetRequest: MeetRecord) => {
    setSelectedMeetRequest(meetRequest);
    setShowAcceptModal(true);
  };

  const confirmAccept = async () => {
    if (!selectedMeetRequest) return;
    await MeetService.accept(selectedMeetRequest.id);
    await loadAll();
    setIndex(2);
    setSelectedMeetRequest(null);
  };

  const reject = async (id: string) => {
    await MeetService.reject(id);
    await loadAll();
  };

  const withdraw = async (id: string) => {
    await MeetService.cancel(id);
    await loadAll();
  };

  useEffect(() => { loadAll(); }, []);

  // Prefetch display name for Jitsi auto-join
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_profiles')
          .select('first_name,last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        const dn = [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim();
        setMyDisplayName(dn || 'Guest');
      } catch {}
    })();
  }, []);

  const buildJitsiHtml = (meetLink: string, displayName: string) => {
    const roomName = (() => { try { return new URL(meetLink).pathname.replace(/^\//, ''); } catch { return meetLink.split('/').pop() || ''; } })();
    const safeName = (displayName || 'Guest').replace(/'/g, "\'");
    return `<!DOCTYPE html><html><head><meta name=viewport content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no" /><script src="https://meet.jit.si/external_api.js"></script><style>html,body,#j{margin:0;padding:0;height:100%;width:100%;background:#000;overflow:hidden}</style></head><body><div id=j></div><script>const api=new JitsiMeetExternalAPI('meet.jit.si',{roomName:'${roomName}',parentNode:document.getElementById('j'),userInfo:{displayName:'${safeName}'},configOverwrite:{prejoinPageEnabled:false,disableDeepLinking:true,startWithAudioMuted:false,startWithVideoMuted:false,toolbarButtons:['microphone','camera','hangup'],enableWelcomePage:false,defaultLanguage:'en',disable1On1Mode:false,enableClosePage:false},interfaceConfigOverwrite:{MOBILE_APP_PROMO:false,HIDE_INVITE_MORE_HEADER:true,TOOLBAR_BUTTONS:['microphone','camera','hangup'],DISABLE_JOIN_LEAVE_NOTIFICATIONS:true}});api.executeCommand('toggleTileView', false);api.addEventListener('videoConferenceJoined',function(){try{document.body.style.background='#000';}catch(e){}});api.addEventListener('videoConferenceLeft',function(){if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage('left');}});</script></body></html>`;
  };

  // Build Agora Web call HTML (web only): joins channel and shows local/remote
  const buildAgoraWebHtml = (channelId: string, displayName: string) => {
    const safeChannel = (channelId || 'default').replace(/[^a-zA-Z0-9-_]/g, '');
    const safeName = (displayName || 'Guest').replace(/'/g, "\'");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name=viewport content="width=device-width, initial-scale=1"/><style>html,body,#app{margin:0;padding:0;height:100%;width:100%;background:#000;overflow:hidden}#videos{position:relative;width:100%;height:100%}#local{position:absolute;right:12px;top:12px;width:160px;height:120px;border-radius:8px;overflow:hidden}#remote{position:absolute;left:0;top:0;right:0;bottom:0}#status{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-family:Arial;text-align:center;padding:20px;background:rgba(0,0,0,0.8);border-radius:8px;max-width:80%;}</style><script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.18.0.js"></script></head><body><div id="app"><div id="videos"><div id="remote"></div><div id="local"></div></div><div id="status">Connecting...</div></div><script>const appId='${AGORA_APP_ID}';const channel='${safeChannel}';const userName='${safeName}';let client,localTrack,localMic;async function start(){const statusEl=document.getElementById('status');try{statusEl.textContent='Initializing...';client=AgoraRTC.createClient({mode:'rtc',codec:'vp8'});client.on('user-published',async(user,mediaType)=>{await client.subscribe(user,mediaType);if(mediaType==='video'){user.videoTrack.play('remote');}if(mediaType==='audio'){user.audioTrack.play();}statusEl.style.display='none';});statusEl.textContent='Joining call...';const uid=Math.floor(Math.random()*100000);await client.join(appId,channel,null,uid);statusEl.textContent='Starting camera...';localTrack=await AgoraRTC.createCameraVideoTrack();localMic=await AgoraRTC.createMicrophoneAudioTrack();localTrack.play('local');await client.publish([localTrack,localMic]);statusEl.style.display='none';}catch(e){console.error('Agora error:',e);if(e.message && e.message.includes('CAN_NOT_GET_GATEWAY_SERVER')){statusEl.innerHTML='<div style="color:#ff6b6b;line-height:1.4;">⚠️ Authentication Error<br/><br/>This Agora App ID requires a security certificate and token generation.<br/><br/>To enable video calls:<br/>• Set up a token server<br/>• Or disable the certificate in Agora Console<br/><br/><small>Contact your developer for assistance.</small></div>';}else{statusEl.innerHTML='<div style="color:#ff6b6b;">Call failed: '+e.message+'<br/><small>Please try again</small></div>';}}}function cleanup(){try{if(localTrack){localTrack.stop();localTrack.close();}if(localMic){localMic.stop();localMic.close();}if(client){client.leave();}}catch(e){}}window.addEventListener('beforeunload',cleanup);start();</script></body></html>`;
  };

  // Normalize any meeting link to meet.jit.si domain to avoid JaaS dev limits
  const toMeetJitsiUrl = (link?: string | null) => {
    if (!link) return null;
    try {
      const url = new URL(link);
      const room = url.pathname.replace(/^\//, '');
      return `https://meet.jit.si/${room}`;
    } catch {
      const seg = (link.split('/').pop() || '').trim();
      if (!seg) return `https://meet.jit.si/hume-${Date.now().toString(36)}`;
      return `https://meet.jit.si/${seg}`;
    }
  };

  // Refresh when tab/screen gains focus
  useEffect(() => {
    if (isFocused) {
      loadAll();
    }
  }, [isFocused]);

  // Tick every minute for enabling join 10 minutes before
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  
  // Format meeting date in the required format: "14 Sep 25"
  const formatMeetingDate = (iso?: string | null): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} at ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };
  
  // Helper function to check if it's time to join a meeting
  const isTimeToJoin = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      return !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
    } catch {
      return false;
    }
  };

  // Helper: ring window = 60 minutes before until 60 minutes after start
  const isWithinRingWindow = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      if (Number.isNaN(scheduledMs)) return false;
      const startWindow = scheduledMs - 60 * 60 * 1000; // 60 min before
      const endWindow = scheduledMs + 60 * 60 * 1000;   // 60 min after start
      return nowTick >= startWindow && nowTick <= endWindow;
    } catch {
      return false;
    }
  };

  // Helper: after ring window = later than 60 minutes after start
  const isAfterRingWindow = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      if (Number.isNaN(scheduledMs)) return false;
      const endWindow = scheduledMs + 60 * 60 * 1000; // 60 min after start
      return nowTick > endWindow;
    } catch {
      return false;
    }
  };

  // Helper: blink window = 60 minutes before until 5 minutes after start
  const isWithinBlinkWindow = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      if (Number.isNaN(scheduledMs)) return false;
      const startWindow = scheduledMs - 60 * 60 * 1000; // 60 min before
      const endWindow = scheduledMs + 5 * 60 * 1000;    // 5 min after start
      return nowTick >= startWindow && nowTick <= endWindow;
    } catch {
      return false;
    }
  };

  // Ring popup removed – we keep only blinking and direct call via Call button

  // Call signaling functions
  const sendCallSignal = async (receiverId: string, channel: string, meetId: string) => {
    if (!myUserId) return;
    
    const callerProfile = profilesById[myUserId];
    const signalData = {
      type: 'incoming_call',
      caller_id: myUserId,
      caller_name: callerProfile?.name || 'Someone',
      caller_avatar: callerProfile?.avatar,
      receiver_id: receiverId,
      channel: channel,
      meet_id: meetId,
      timestamp: new Date().toISOString()
    };

    // Send via Supabase realtime
    await supabase
      .channel('call-signals')
      .send({
        type: 'broadcast',
        event: 'call_signal',
        payload: signalData
      });
  };

  const endCallSignal = async (receiverId: string, channel: string) => {
    if (!myUserId) return;
    
    const signalData = {
      type: 'call_ended',
      caller_id: myUserId,
      receiver_id: receiverId,
      channel: channel,
      timestamp: new Date().toISOString()
    };

    await supabase
      .channel('call-signals')
      .send({
        type: 'broadcast',
        event: 'call_signal',
        payload: signalData
      });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    // Send acceptance signal back to caller
    const acceptData = {
      type: 'call_accepted',
      caller_id: incomingCall.callerId,
      receiver_id: myUserId,
      channel: incomingCall.channel,
      timestamp: new Date().toISOString()
    };

    await supabase
      .channel('call-signals')
      .send({
        type: 'broadcast',
        event: 'call_signal',
        payload: acceptData
      });
    
    setIncomingCall(null);
    setIsCallActive(true);
    stopWebBeep();
    
    // Join the call
    const channel = incomingCall.channel;
    if (Platform.OS === 'web') {
      const html = buildAgoraWebHtml(channel, myDisplayName || 'Guest');
      setWebCallHtml(html);
      setShowWebCallModal(true);
    } else {
      // @ts-ignore
      navigation.navigate('call' as never, { channel } as never);
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    
    // Send rejection signal back to caller
    const rejectData = {
      type: 'call_rejected',
      caller_id: incomingCall.callerId,
      receiver_id: myUserId,
      channel: incomingCall.channel,
      timestamp: new Date().toISOString()
    };

    await supabase
      .channel('call-signals')
      .send({
        type: 'broadcast',
        event: 'call_signal',
        payload: rejectData
      });
    
    setIncomingCall(null);
    stopWebBeep();
  };

  const cancelOutgoingCall = async () => {
    if (!outgoingCall) return;
    
    setOutgoingCall(null);
    stopWebBeep();
    
    // Send cancellation signal
    await endCallSignal(outgoingCall.receiverId, outgoingCall.channel);
  };

  const startVideoCall = (channel: string) => {
    setIsCallActive(true);
    if (Platform.OS === 'web') {
      const html = buildAgoraWebHtml(channel, myDisplayName || 'Guest');
      setWebCallHtml(html);
      setShowWebCallModal(true);
    } else {
      // @ts-ignore
      navigation.navigate('call' as never, { channel } as never);
    }
  };

  useEffect(() => {
    const ch = supabase
      .channel('meet-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_requests' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Call signaling subscription
  useEffect(() => {
    if (!myUserId) return;

    const callChannel = supabase
      .channel('call-signals')
      .on('broadcast', { event: 'call_signal' }, (payload) => {
        const data = payload.payload;
        
        if (data.receiver_id === myUserId && data.type === 'incoming_call') {
          // Show incoming call UI
          setIncomingCall({
            callerId: data.caller_id,
            callerName: data.caller_name,
            callerAvatar: data.caller_avatar,
            channel: data.channel,
            meetId: data.meet_id
          });
          
          // Start ringing sound/vibration
          if (webSoundEnabled) startWebBeep(false);
          else setNeedSoundUnlock(true);
          if (Platform.OS !== 'web') {
            try { Vibration.vibrate([500, 500, 500, 500], true); } catch {}
          }
        } else if (data.receiver_id === myUserId && data.type === 'call_ended') {
          // Call was ended by caller
          setIncomingCall(null);
          setIsCallActive(false);
          stopWebBeep();
          if (Platform.OS !== 'web') {
            try { Vibration.cancel(); } catch {}
          }
        } else if (data.caller_id === myUserId && data.type === 'call_accepted') {
          // Our outgoing call was accepted
          setOutgoingCall(null);
          stopWebBeep();
          startVideoCall(data.channel);
        } else if (data.caller_id === myUserId && data.type === 'call_rejected') {
          // Our outgoing call was rejected
          setOutgoingCall(null);
          stopWebBeep();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(callChannel); };
  }, [myUserId, webSoundEnabled]);

  // Mark approved meets as seen whenever the Approved tab becomes active
  useEffect(() => {
    if (index === 2) {
      SecureStore.setItemAsync('LAST_SEEN_APPROVED_MEETS', new Date().toISOString()).catch(() => {});
    }
  }, [index]);

  useEffect(() => {
    setRoutes([
      { key: 'received', title: `Received (${incoming.length})` },
      { key: 'sent', title: `Sent (${outgoing.length})` },
      { key: 'approved', title: `Approved (${approved.length})` },
    ]);
  }, [incoming.length, outgoing.length, approved.length]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primary }}
      style={{ backgroundColor: COLORS.white }}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.greyscale900}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Image source={icons.videoCamera2} contentFit='contain' style={[styles.headerLogo, {tintColor: COLORS.primary}]} />
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Meet Requests</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => {
            try {
              if (Platform.OS === 'web') {
                const next = !webSoundEnabled;
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(WEB_SOUND_ENABLED_KEY, next ? '1' : '0');
                }
                setWebSoundEnabled(next);
                if (!next) {
                  stopWebBeep();
                } else {
                  // If a call UI is visible, attempt to start immediately
                  if (incomingCall || outgoingCall) startWebBeep(false);
                }
              } else {
                const nextMuted = !ringMuted;
                setRingMuted(nextMuted);
                SecureStore.setItemAsync(RING_MUTE_KEY, nextMuted ? '1' : '0').catch(() => {});
                if (nextMuted) {
                  Vibration.cancel();
                }
              }
            } catch {}
          }}
          style={{ paddingHorizontal: 8, paddingVertical: 6 }}
        >
          <Image
            source={Platform.OS === 'web' ? (webSoundEnabled ? icons.mediumVolume : icons.noSound) : (!ringMuted ? icons.mediumVolume : icons.noSound)}
            contentFit='contain'
            style={{ width: 22, height: 22, tintColor: Platform.OS === 'web' ? (webSoundEnabled ? COLORS.primary : COLORS.black) : (!ringMuted ? COLORS.primary : COLORS.black) }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const Row = ({ row, idx, otherUserId, scheduledText, scheduledAtISO, requestText, actions, hideInlineJoin }: { row: MeetRecord; idx: number; otherUserId: string; scheduledText?: string; scheduledAtISO?: string | null; requestText?: string; actions: React.ReactNode; hideInlineJoin?: boolean }) => {
    const other = profilesById[otherUserId];
    const scheduledMs = scheduledAtISO ? new Date(scheduledAtISO).getTime() : NaN;
    const canJoin = !!row.meet_link && !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
    return (
      <View key={row.id} style={[
        styles.userContainer,
        idx % 2 !== 0 ? styles.oddBackground : null,
        (isWithinBlinkWindow(scheduledAtISO || null)) ? { backgroundColor: blinkOn ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.35)' } : null,
      ]}>
        <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
          <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.maleSilhouette} contentFit='cover' style={styles.userImage} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
              <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                {other?.name || otherUserId}
              </Text>
            </TouchableOpacity>
            <View style={styles.rowActions}>
              {actions}
              {!!scheduledText && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Image source={icons.videoCamera2} contentFit='contain' style={{ width: 14, height: 14, tintColor: COLORS.primary }} />
                  <Text style={styles.lastMessageTime}>{scheduledText}</Text>
                  {!hideInlineJoin && row.meet_link && (
                    <TouchableOpacity
                      onPress={() => {
                        if (canJoin) {
                          const url = toMeetJitsiUrl(row.meet_link);
                          if (url) Linking.openURL(url);
                        }
                        else { Alert.alert('Meeting not active yet', 'Join link will be active 10 minutes before the scheduled time.'); }
                      }}
                      disabled={!canJoin}
                    >
                      <Text style={[styles.joinLink, !canJoin && { color: 'gray', opacity: 0.7 }]}>Join</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={{ position: 'absolute', right: 4, alignItems: 'flex-end', width: SIZES.width - 16 }}>
            {!!requestText && (
              <Text style={styles.lastMessageTime}>{requestText}</Text>
            )}
            {/* Join link moved next to scheduled time */}
          </View>
        </View>
      </View>
    );
  };

  const SkeletonRow = ({ idx }: { idx: number }) => (
    <View style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
      <View style={styles.userImageContainer}>
        <View style={[styles.userImage, { backgroundColor: '#eee' }]} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <View style={{ height: 14, width: '40%', backgroundColor: '#eee', borderRadius: 6 }} />
        <View style={{ height: 12, width: '60%', backgroundColor: '#f2f2f2', borderRadius: 6 }} />
      </View>
    </View>
  );

  const ReceivedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : incoming.length === 0 ? (
        <Text style={styles.subtitle}>No received meet requests</Text>
      ) : (
        incoming.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.sender_id}
            scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
            scheduledAtISO={row.scheduled_at || undefined}
            requestText={formatRequestTime(row.created_at)}
            actions={
              <>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={() => handleAcceptClick(row)}>
                  <Text style={styles.tinyBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => reject(row.id)}>
                  <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Reject</Text>
                </TouchableOpacity>
              </>
            }
          />
        ))
      )}
    </ScrollView>
  );

  const SentRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : outgoing.length === 0 ? (
        <Text style={styles.subtitle}>No sent meet requests</Text>
      ) : (
        outgoing.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.receiver_id}
            scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
            scheduledAtISO={row.scheduled_at || undefined}
            requestText={formatRequestTime(row.created_at)}
            actions={
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => withdraw(row.id)}>
                <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Withdraw</Text>
              </TouchableOpacity>
            }
          />
        ))
      )}
    </ScrollView>
  );

  const ApprovedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : approved.length === 0 ? (
        <Text style={styles.subtitle}>No approved meet requests</Text>
      ) : (
        approved.map((row, idx) => {
          const scheduledMs = row.scheduled_at ? new Date(row.scheduled_at).getTime() : NaN;
          const canJoin = !!row.meet_link && !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
          const canCall = isWithinRingWindow(row.scheduled_at || null);
          const otherUserId = myUserId && row.sender_id === myUserId ? row.receiver_id : row.sender_id;
          return (
            <Row
              key={row.id}
              row={row}
              idx={idx}
              otherUserId={otherUserId}
              scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
              scheduledAtISO={row.scheduled_at || undefined}
              requestText={formatRequestTime(row.updated_at)}
              hideInlineJoin
              actions={
                <>
                  <TouchableOpacity
                    style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                    onPress={async () => {
                      try {
                        if (!canCall) {
                      setSelectedMeetRow(row);
                      setShowJoinInfoModal(true);
                          return;
                        }
                        
                        const channel = row.id;
                        const receiverId = otherUserId;
                        
                        if (receiverId) {
                          // Show outgoing call interface
                          const receiverProfile = profilesById[receiverId];
                          setOutgoingCall({
                            receiverId,
                            receiverName: receiverProfile?.name || 'User',
                            receiverAvatar: receiverProfile?.avatar,
                            channel,
                            meetId: row.id
                          });
                          
                          // Start outgoing call beeps
                          if (webSoundEnabled) startWebBeep(true);
                          else setNeedSoundUnlock(true);
                          
                          // Send call signal to the other user
                          await sendCallSignal(receiverId, channel, row.id);
                        }
                      } catch {}
                    }}
                  >
                    <Text style={styles.tinyBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => withdraw(row.id)}>
                    <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              }
            />
          );
        })
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({ received: ReceivedRoute, sent: SentRoute, approved: ApprovedRoute });

    return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
        
        {/* Join Meeting Info Modal */}
        <Modal
          visible={showJoinInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJoinInfoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Video Call Access</Text>
              
              <View style={styles.meetingInfoContainer}>
                {selectedMeetRow?.scheduled_at && (
                  <Text style={styles.scheduledTimeText}>
                    Scheduled for: {formatMeetingDate(selectedMeetRow.scheduled_at)}
                  </Text>
                )}
                
                <View style={styles.infoRow}>
                  <Image 
                    source={icons.videoCamera2} 
                    contentFit="contain" 
                    style={{ width: 24, height: 24, tintColor: COLORS.primary, marginRight: 12 }} 
                  />
                  <Text style={styles.infoText}>
                    Video call is available 60 minutes before and after the scheduled time
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Image 
                    source={icons.clock} 
                    contentFit="contain" 
                    style={{ width: 24, height: 24, tintColor: COLORS.primary, marginRight: 12 }} 
                  />
                  <Text style={styles.infoText}>
                    {selectedMeetRow && selectedMeetRow.scheduled_at ? (
                      isWithinRingWindow(selectedMeetRow.scheduled_at)
                        ? "You can call now"
                        : isAfterRingWindow(selectedMeetRow.scheduled_at)
                          ? "Video call window has ended. Please cancel this call request and send new request  from the profile's page"
                          : "Video call is not yet available"
                    ) : ""}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowJoinInfoModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
                </TouchableOpacity>
                
                {selectedMeetRow && selectedMeetRow.meet_link && isWithinRingWindow(selectedMeetRow.scheduled_at) && (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.joinButton]} 
                    onPress={() => {
                      setShowJoinInfoModal(false);
                      if (selectedMeetRow?.meet_link) {
                        const normalized = toMeetJitsiUrl(selectedMeetRow.meet_link);
                        const html = buildJitsiHtml(normalized || selectedMeetRow.meet_link, myDisplayName);
                        setJitsiHtml(html);
                        setShowJitsiModal(true);
                      }
                    }}
                  >
                    <Image source={icons.videoCamera2} contentFit="contain" style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                    <Text style={styles.modalButtonText}>Call Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <Modal visible={true} transparent animationType="fade" onRequestClose={rejectCall}>
            <View style={styles.modalContainer}>
              <View style={styles.ringCard}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={styles.ringAvatarWrapper}>
                    <View style={[styles.ringPulse, blinkOn && styles.ringPulseAlt]} />
                    <View style={[styles.ringPulse, { width: 110, height: 110, opacity: 0.2 }]} />
                    <Image
                      source={
                        incomingCall.callerAvatar 
                          ? (typeof incomingCall.callerAvatar === 'string' ? { uri: incomingCall.callerAvatar } : incomingCall.callerAvatar)
                          : images.maleSilhouette
                      }
                      contentFit='cover'
                      style={styles.ringAvatar}
                    />
                  </View>
                  <Text style={[styles.ringCallerName, { color: COLORS.greyscale900 }]}>
                    {incomingCall.callerName}
                  </Text>
                  <Text style={[styles.ringCallText, { color: COLORS.greyscale600 }]}>
                    Incoming video call...
                  </Text>
                </View>
                
                <View style={styles.ringButtonsContainer}>
                  {Platform.OS === 'web' && needSoundUnlock && (
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          setNeedSoundUnlock(false);
                          startWebBeep(false);
                        } catch {}
                      }}
                      style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.tansparentPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                    >
                      <Image
                        source={webSoundEnabled ? icons.mediumVolume : icons.noSound}
                        contentFit='contain'
                        style={{ width: 18, height: 18, tintColor: COLORS.primary }}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.ringButton, styles.rejectButton]} onPress={rejectCall}>
                    <Image source={icons.telephone} contentFit='contain' style={[styles.ringButtonIcon, { tintColor: 'white', transform: [{ rotate: '135deg' }] }]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.ringButton, styles.acceptButton]} onPress={acceptCall}>
                    <Image source={icons.telephone} contentFit='contain' style={[styles.ringButtonIcon, { tintColor: 'white' }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Outgoing Call Modal */}
        {outgoingCall && (
          <Modal visible={true} transparent animationType="fade" onRequestClose={cancelOutgoingCall}>
            <View style={styles.modalContainer}>
              <View style={styles.ringCard}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={styles.ringAvatarWrapper}>
                    <View style={[styles.ringPulse, blinkOn && styles.ringPulseAlt]} />
                    <View style={[styles.ringPulse, { width: 110, height: 110, opacity: 0.2 }]} />
                    <Image
                      source={
                        outgoingCall.receiverAvatar 
                          ? (typeof outgoingCall.receiverAvatar === 'string' ? { uri: outgoingCall.receiverAvatar } : outgoingCall.receiverAvatar)
                          : images.maleSilhouette
                      }
                      contentFit='cover'
                      style={styles.ringAvatar}
                    />
                  </View>
                  <Text style={[styles.ringCallerName, { color: COLORS.greyscale900 }]}>
                    {outgoingCall.receiverName}
                  </Text>
                  <Text style={[styles.ringCallText, { color: COLORS.greyscale600 }]}>
                    Calling...
                  </Text>
                </View>
                
                <View style={styles.ringButtonsContainer}>
                  {Platform.OS === 'web' && needSoundUnlock && (
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          setNeedSoundUnlock(false);
                          startWebBeep(true);
                        } catch {}
                      }}
                      style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.tansparentPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                    >
                      <Image
                        source={webSoundEnabled ? icons.mediumVolume : icons.noSound}
                        contentFit='contain'
                        style={{ width: 18, height: 18, tintColor: COLORS.primary }}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.ringButton, styles.rejectButton]} onPress={cancelOutgoingCall}>
                    <Image source={icons.telephone} contentFit='contain' style={[styles.ringButtonIcon, { tintColor: 'white', transform: [{ rotate: '135deg' }] }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Ring (Incoming Meeting) Modal */}
        <Modal visible={showRingModal} transparent animationType="fade" onRequestClose={() => { setShowRingModal(false); }}>
          <View style={styles.modalContainer}>
            <View style={styles.ringCard}>
              <TouchableOpacity style={styles.jitsiCloseButton} onPress={() => {
                if (ringMeetRow) {
                  setRingDismissedIds(prev => new Set(prev).add(ringMeetRow.id));
                  setHighlightMeetId(ringMeetRow.id);
                }
                setShowRingModal(false);
                setRingMeetRow(null);
                setIndex(2);
                if (Platform.OS !== 'web') Vibration.cancel();
              }}>
                <Text style={styles.jitsiCloseButtonText}>×</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.ringAvatarWrapper}>
                  <View style={[styles.ringPulse, blinkOn && styles.ringPulseAlt]} />
                  <View style={[styles.ringPulse, { width: 110, height: 110, opacity: 0.2 }]} />
                  <Image
                    source={
                      ringMeetRow
                        ? (
                            profilesById[ringMeetRow.sender_id]?.avatar
                              ? (
                                  typeof profilesById[ringMeetRow.sender_id].avatar === 'string'
                                    ? { uri: profilesById[ringMeetRow.sender_id].avatar }
                                    : profilesById[ringMeetRow.sender_id].avatar
                                )
                              : images.maleSilhouette
                          )
                        : images.maleSilhouette
                    }
                    contentFit='cover'
                    style={{ width: 84, height: 84, borderRadius: 42 }}
                  />
                </View>
              </View>
              <Text style={[styles.modalTitle, { marginBottom: 6 }]}>
                {ringMeetRow ? (profilesById[ringMeetRow.sender_id]?.name || 'Incoming meeting') : 'Incoming meeting'}
              </Text>
              <Text style={[styles.infoText, { textAlign: 'center', marginBottom: 16 }]}>
                {ringMeetRow?.scheduled_at ? `Scheduled for ${formatMeetingDate(ringMeetRow.scheduled_at)}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {/* Permanent sound toggle in ring popup */}
                <TouchableOpacity
                  onPress={() => {
                    try {
                      if (Platform.OS === 'web') {
                        const next = !webSoundEnabled;
                        if (typeof window !== 'undefined') {
                          window.localStorage.setItem(WEB_SOUND_ENABLED_KEY, next ? '1' : '0');
                        }
                        setWebSoundEnabled(next);
                        if (!next) { stopWebBeep(); }
                        else { startWebBeep(false); }
                      } else {
                        const nextMuted = !ringMuted;
                        setRingMuted(nextMuted);
                        SecureStore.setItemAsync(RING_MUTE_KEY, nextMuted ? '1' : '0').catch(() => {});
                        if (nextMuted) { Vibration.cancel(); }
                      }
                    } catch {}
                  }}
                  style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                >
                  <Image
                    source={Platform.OS === 'web' ? (webSoundEnabled ? icons.mediumVolume : icons.noSound) : (!ringMuted ? icons.mediumVolume : icons.noSound)}
                    contentFit='contain'
                    style={{ width: 22, height: 22, tintColor: Platform.OS === 'web' ? (webSoundEnabled ? COLORS.primary : COLORS.black) : (!ringMuted ? COLORS.primary : COLORS.black) }}
                  />
                </TouchableOpacity>
                {Platform.OS === 'web' && needSoundUnlock && (
                  <TouchableOpacity
                    onPress={() => {
                      // A user gesture to unlock audio
                      try {
                        if (!ringMuted) {
                          setNeedSoundUnlock(false);
                          startWebBeep(false);
                        }
                      } catch {}
                    }}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.tansparentPrimary }}
                  >
                    <Text style={{ color: COLORS.primary, fontFamily: 'medium' }}>enable sound</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalButton, styles.joinButton]}
                  onPress={() => {
                    if (!ringMeetRow?.meet_link) return;
                    setShowRingModal(false);
                    setSelectedMeetRow(ringMeetRow);
                    setShowJoinInfoModal(true);
                    if (Platform.OS !== 'web') Vibration.cancel();
                    if (ringAudioRef.current) { try { ringAudioRef.current.pause(); ringAudioRef.current = null; } catch {} }
                    stopWebBeep();
                  }}
                >
                  <Image source={icons.videoCamera2} contentFit='contain' style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                  <Text style={styles.modalButtonText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    if (ringMeetRow) {
                      setRingDismissedIds(prev => new Set(prev).add(ringMeetRow.id));
                      setHighlightMeetId(ringMeetRow.id);
                    }
                    setShowRingModal(false);
                    setRingMeetRow(null);
                    setIndex(2);
                    if (Platform.OS !== 'web') Vibration.cancel();
                    if (ringAudioRef.current) { try { ringAudioRef.current.pause(); ringAudioRef.current = null; } catch {} }
                    stopWebBeep();
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Centered Jitsi Modal */}
        <Modal visible={showJitsiModal} transparent={true} animationType="fade" onRequestClose={() => setShowJitsiModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.jitsiCard}>
              <TouchableOpacity style={styles.jitsiCloseButton} onPress={() => setShowJitsiModal(false)}>
                <Text style={styles.jitsiCloseButtonText}>×</Text>
              </TouchableOpacity>
              <View style={styles.jitsiVideoContainer}>
              {!!jitsiHtml && (
                Platform.OS === 'web' ? (
                  <iframe
                    srcDoc={jitsiHtml as any}
                    style={{ width: '100%', height: '100%', border: 0 } as any}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                ) : (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: jitsiHtml }}
                    onMessage={(e) => { if (e.nativeEvent.data === 'left') { setShowJitsiModal(false); } }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    style={{ flex:1 }}
                  />
                )
              )}
            </View>
            </View>
          </View>
        </Modal>

        {/* Web-only Agora Call Modal */}
        {Platform.OS === 'web' && (
          <Modal visible={showWebCallModal} transparent={true} animationType="fade" onRequestClose={() => setShowWebCallModal(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.jitsiCard}>
                <TouchableOpacity style={styles.jitsiCloseButton} onPress={() => {
                  setShowWebCallModal(false);
                  setIsCallActive(false);
                  // End call signal if this was an active call
                  if (isCallActive && approved.length > 0) {
                    const currentCall = approved.find(row => row.id === webCallHtml?.match(/channel='([^']+)'/)?.[1]);
                    if (currentCall && myUserId) {
                      const otherUserId = currentCall.sender_id === myUserId ? currentCall.receiver_id : currentCall.sender_id;
                      endCallSignal(otherUserId, currentCall.id);
                    }
                  }
                }}>
                  <Text style={styles.jitsiCloseButtonText}>×</Text>
            </TouchableOpacity>
                <View style={styles.jitsiVideoContainer}>
                  {!!webCallHtml && (
                    <iframe
                      srcDoc={webCallHtml as any}
                      style={{ width: '100%', height: '100%', border: 0 } as any}
                      allow="camera; microphone; fullscreen; autoplay"
                    />
                  )}
                </View>
              </View>
          </View>
        </Modal>
        )}
        
        {/* Accept Confirmation Modal */}
        <AcceptConfirmationModal
          visible={showAcceptModal}
          onClose={() => {
            setShowAcceptModal(false);
            setSelectedMeetRequest(null);
          }}
          onAccept={confirmAccept}
          userName={selectedMeetRequest ? (profilesById[selectedMeetRequest.sender_id]?.name || 'Member') : ''}
          userAge={selectedMeetRequest ? (profilesById[selectedMeetRequest.sender_id]?.age || 0) : 0}
          requestType="video"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.white, padding: 16 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: SIZES.width - 32, justifyContent: 'space-between' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  meetingInfoContainer: {
    marginVertical: 16,
  },
  scheduledTimeText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jitsiCard: {
    backgroundColor: COLORS.black,
    borderRadius: 16,
    width: '100%',
    maxWidth: 900,
    height: 680,
    maxHeight: '92%',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  jitsiVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  jitsiCloseButton: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jitsiCloseButtonText: {
    fontSize: 22,
    fontFamily: 'bold',
    color: COLORS.black,
    marginTop: -1,
  },
  modalButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.tansparentPrimary,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginRight: 10,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.white,
  },
  ringCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ringAvatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.tansparentPrimary,
  },
  ringPulseAlt: {
    opacity: 0.35,
  },
  ringAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { height: 36, width: 36, tintColor: COLORS.primary },
  headerTitle: { fontSize: 20, fontFamily: 'bold', color: COLORS.black, marginLeft: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'regular', color: COLORS.black, textAlign: 'center', marginVertical: 12 },
  userContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderBottomColor: COLORS.secondaryWhite, borderBottomWidth: 1 },
  userImageContainer: { paddingVertical: 15, marginRight: 22 },
  userImage: { height: 50, width: 50, borderRadius: 25 },
  oddBackground: { backgroundColor: COLORS.tertiaryWhite },
  userInfoContainer: { flex: 1 },
  userName: { fontSize: 14, color: COLORS.black, fontFamily: 'bold', marginBottom: 8 },
  lastMessageTime: { fontSize: 12, fontFamily: 'regular', color: COLORS.black },
  joinLink: { fontSize: 16, fontFamily: 'bold', color: COLORS.primary, marginTop: 0 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tinyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tinyBtnText: { fontSize: 12, color: COLORS.white, fontFamily: 'semiBold' },
  ringButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  ringButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  ringButtonIcon: {
    width: 24,
    height: 24,
  },
  ringCallerName: {
    fontSize: 20,
    fontFamily: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  ringCallText: {
    fontSize: 16,
    fontFamily: 'regular',
  },
});

export default MeetRequestsScreen;



// Jitsi Modal appended at root to avoid layout conflicts
// Rendered inside the component above; this placeholder ensures typings are satisfied