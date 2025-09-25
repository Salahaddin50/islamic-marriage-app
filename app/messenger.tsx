import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { COLORS, icons, SIZES } from '@/constants';
import { supabase } from '@/src/config/supabase';
import { InterestsService, InterestRecord } from '@/src/services/interests';
import { MeetService, MeetRecord } from '@/src/services/meet';
import { MessageRequestsService, MessageRequestRecord } from '@/src/services/message-requests.service';
import { ConversationsService, ConversationRecord, ConversationMessageRecord } from '@/src/services/conversations';
import { getResponsiveFontSize, getResponsiveSpacing, safeGoBack, isDesktopWeb } from '@/utils/responsive';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  profile_picture_url?: string;
  gender: 'male' | 'female';
  country?: string;
  city?: string;
}

interface ChatMessage {
  id: string;
  type: 'photo_request_sent' | 'photo_request_received' | 'photo_request_approved' | 
        'video_request_sent' | 'video_request_received' | 'video_request_approved' |
        'message_request_sent' | 'message_request_received' | 'message_request_approved' |
        'text_message';
  isSent: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
  scheduledAt?: string;
  meetLink?: string;
  recordId: string;
  canTakeAction: boolean; // whether user can accept/reject
  content?: string; // for text messages
}

interface Contact {
  userId: string;
  profile: UserProfile;
  lastActivity: string;
  messages: ChatMessage[];
  hasUnreadActivity: boolean;
  conversationId?: string; // Add conversation ID for real messaging
  otherReadAt?: string | null; // Last read timestamp of the other participant
  unreadCount: number; // unread text messages from the other user
}

const Messenger = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { t } = useTranslation();
  const desktop = Platform.OS === 'web' && isDesktopWeb();

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const loadChatRef = useRef<null | ((id: string) => void)>(null);
  const [messagesLoadingByUser, setMessagesLoadingByUser] = useState<Record<string, boolean>>({});
  const [newMessage, setNewMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [currentUserGender, setCurrentUserGender] = useState<'male' | 'female' | null>(null);
  const [currentPackage, setCurrentPackage] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get selected contact
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.userId === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  const getTextMessageCount = useCallback((c?: Contact | null) => {
    if (!c) return 0;
    return c.messages.filter(m => m.type === 'text_message').length;
  }, []);

  const getTextMessageCountLabel = useCallback((c?: Contact | null) => {
    const count = getTextMessageCount(c);
    return `${count} message${count === 1 ? '' : 's'}`;
  }, [getTextMessageCount]);

  // Load current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Load gender
        try {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('gender')
            .eq('user_id', user.id)
            .single();
          if (prof?.gender === 'male' || prof?.gender === 'female') {
            setCurrentUserGender(prof.gender);
          }
        } catch {}
        // Load current package (latest completed)
        try {
          const { data: records } = await supabase
            .from('payment_records')
            .select('package_type,status,created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          const latest = (records || []).find((r: any) => (r.status || '').toLowerCase() === 'completed');
          if (latest?.package_type) setCurrentPackage(String(latest.package_type));
        } catch {}
      }
    };
    getCurrentUser();
  }, []);

  // Load contacts (approved interests only) for fast initial render
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      // Only pull approved interests to construct contact list
      const interestsApproved = await InterestsService.listApproved({ limit: 200 });
      const contactsMap = new Map<string, Contact>();
      interestsApproved.forEach(r => {
        const otherUserId = r.sender_id === currentUserId ? r.receiver_id : r.sender_id;
        if (!contactsMap.has(otherUserId)) {
          contactsMap.set(otherUserId, {
            userId: otherUserId,
            profile: {} as UserProfile,
            lastActivity: r.updated_at || r.created_at,
            messages: [],
            hasUnreadActivity: false,
            unreadCount: 0,
          });
        }
      });

      // Load user profiles for all contacts
      const userIds = Array.from(contactsMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, age, profile_picture_url, gender, country, city')
          .in('user_id', userIds);

        profiles?.forEach(profile => {
          const contact = contactsMap.get(profile.user_id);
          if (contact) {
            contact.profile = {
              id: profile.user_id,
              user_id: profile.user_id,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              age: profile.age,
              profile_picture_url: profile.profile_picture_url,
              gender: profile.gender,
              country: profile.country,
              city: profile.city
            };
          }
        });
      }

      // Sort contacts by last activity
      const contactsList = Array.from(contactsMap.values())
        .map(c => {
          const existing = contacts.find(prev => prev.userId === c.userId);
          return {
            ...c,
            messages: existing?.messages || c.messages,
            hasUnreadActivity: existing?.hasUnreadActivity ?? c.hasUnreadActivity,
            unreadCount: existing?.unreadCount ?? c.unreadCount,
          } as Contact;
        })
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

      // Preserve already loaded message threads to prevent flicker/resets
      setContacts(prev => contactsList.map(c => {
        const prevC = prev.find(p => p.userId === c.userId);
        return {
          ...c,
          messages: prevC?.messages && prevC.messages.length > 0 ? prevC.messages : c.messages,
        } as Contact;
      }));

      // Auto-select first contact on desktop
      if (desktop && contactsList.length > 0 && !selectedContactId) {
        const firstId = contactsList[0].userId;
        setSelectedContactId(firstId);
        // Lazy-load chat for first contact on desktop
        setTimeout(() => loadChatRef.current && loadChatRef.current(firstId), 0);
      }

    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert(t('common.error'), 'Failed to load conversations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, desktop, selectedContactId, t]);

  // Ensure chat reloads if selection changes (handles list refreshes on desktop)
  useEffect(() => {
    if (!desktop) return;
    if (!selectedContactId) return;
    const tid = setTimeout(() => {
      loadChatRef.current && loadChatRef.current(selectedContactId);
    }, 0);
    return () => clearTimeout(tid);
  }, [desktop, selectedContactId]);

  // Lazy-load messages for a specific contact
  const loadChatForContact = useCallback(async (otherUserId: string) => {
    if (!currentUserId) return;
    const contact = contacts.find(c => c.userId === otherUserId);
    if (!contact) return;
    if (messagesLoadingByUser[otherUserId]) return;

    setMessagesLoadingByUser(prev => ({ ...prev, [otherUserId]: true }));
    try {
      // Get or create conversation
      const conversation = await ConversationsService.getOrCreateByOtherUser(currentUserId, otherUserId);
      
      const [interestsRes, meetsRes, messagesRes, conversationRow] = await Promise.all([
        supabase
          .from('interests')
          .select('id,sender_id,receiver_id,status,created_at,updated_at')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`),
        supabase
          .from('meet_requests')
          .select('id,sender_id,receiver_id,status,scheduled_at,meet_link,created_at,updated_at')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true }),
        supabase
          .from('message_requests')
          .select('id,sender_id,receiver_id,status,created_at,updated_at')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true }),
        supabase
          .from('conversations')
          .select('messages,last_read_at_user_a,last_read_at_user_b,user_a,user_b')
          .eq('id', conversation.id)
          .single()
      ]);

      // If messages already loaded, just ensure conversationId is stored
      if (contact.messages && contact.messages.length > 0) {
        setContacts(prev => prev.map(c => c.userId === otherUserId ? { 
          ...c, 
          conversationId: conversation.id 
        } : c));
        // Mark as read
        try { await ConversationsService.markRead(conversation.id); } catch {}
        return;
      }

      const msgs: ChatMessage[] = [];
      const interest = (interestsRes.data || [])[0];
      if (interest) {
        msgs.push({
          id: `${interest.id}_orig`,
          type: interest.sender_id === currentUserId ? 'photo_request_sent' : 'photo_request_received',
          isSent: interest.sender_id === currentUserId,
          status: interest.status as any,
          timestamp: interest.created_at,
          recordId: interest.id,
          canTakeAction: false,
        });
        if (interest.status === 'accepted') {
          msgs.push({
            id: `${interest.id}_approved`,
            type: 'photo_request_approved',
            isSent: interest.receiver_id === currentUserId,
            status: 'accepted',
            timestamp: interest.updated_at || interest.created_at,
            recordId: interest.id,
            canTakeAction: false,
          });
        }
      }

      (meetsRes.data || []).forEach((r: any) => {
        msgs.push({
          id: r.id,
          type: r.status === 'accepted' ? 'video_request_approved' : (r.sender_id === currentUserId ? 'video_request_sent' : 'video_request_received'),
          isSent: r.sender_id === currentUserId,
          status: r.status,
          timestamp: r.updated_at || r.created_at,
          scheduledAt: r.scheduled_at || undefined,
          meetLink: r.meet_link || undefined,
          recordId: r.id,
          canTakeAction: false,
        });
      });

      (messagesRes.data || []).forEach((r: any) => {
        msgs.push({
          id: r.id,
          type: r.status === 'accepted' ? 'message_request_approved' : (r.sender_id === currentUserId ? 'message_request_sent' : 'message_request_received'),
          isSent: r.sender_id === currentUserId,
          status: r.status,
          timestamp: r.updated_at || r.created_at,
          recordId: r.id,
          canTakeAction: false,
        });
      });

      // Add conversation text messages
      const convoMessages: any[] = (conversationRow.data?.messages ?? []) as any[];
      convoMessages.forEach((msg: any) => {
        msgs.push({
          id: msg.id,
          type: 'text_message',
          isSent: msg.sender_id === currentUserId,
          status: 'accepted',
          timestamp: msg.created_at,
          recordId: msg.id,
          canTakeAction: false,
          content: msg.content || '',
        });
      });

      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const otherReadAt = (conversationRow.data?.user_a === currentUserId)
        ? conversationRow.data?.last_read_at_user_b
        : conversationRow.data?.last_read_at_user_a;

      // Compute unread (text) messages from the other user since my last read
      const myLastReadAt = (conversationRow.data?.user_a === currentUserId)
        ? conversationRow.data?.last_read_at_user_a
        : conversationRow.data?.last_read_at_user_b;
      let unreadCount = 0;
      if (myLastReadAt) {
        unreadCount = convoMessages.filter((m: any) => m.message_type === 'text' && m.created_at > myLastReadAt && m.sender_id !== currentUserId).length;
      } else {
        unreadCount = convoMessages.filter((m: any) => m.message_type === 'text' && m.sender_id !== currentUserId).length;
      }

      setContacts(prev => prev.map(c => c.userId === otherUserId ? { 
        ...c, 
        messages: msgs, 
        conversationId: conversation.id,
        otherReadAt: otherReadAt ?? null,
        unreadCount,
        hasUnreadActivity: unreadCount > 0,
      } : c));

      // Mark as read
      try { await ConversationsService.markRead(conversation.id); } catch {}
    } finally {
      setMessagesLoadingByUser(prev => ({ ...prev, [otherUserId]: false }));
    }
  }, [currentUserId, contacts, messagesLoadingByUser]);

  // Keep ref pointing at latest loader to avoid TDZ/use-before-init in closures
  useEffect(() => {
    loadChatRef.current = (id: string) => { loadChatForContact(id); };
  }, [loadChatForContact]);

  // Load conversations lazily after first paint
  useEffect(() => {
    if (!currentUserId) return;
    const id = setTimeout(() => {
      loadConversations();
    }, 0);
    return () => clearTimeout(id);
  }, [currentUserId, loadConversations]);

  // Realtime: keep conversation list and unread counts in sync
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload: any) => {
          const row = payload.new || payload.record;
          if (!row) return;
          const { id: conversationId, user_a, user_b, last_message_at, messages, last_read_at_user_a, last_read_at_user_b } = row;
          if (!(user_a === currentUserId || user_b === currentUserId)) return;
          const otherUserId = user_a === currentUserId ? user_b : user_a;

          // Compute otherReadAt and myLastReadAt
          const otherReadAt = (user_a === currentUserId) ? last_read_at_user_b : last_read_at_user_a;
          const myLastReadAt = (user_a === currentUserId) ? last_read_at_user_a : last_read_at_user_b;

          // Transform text messages from row.messages (if present)
          const textMsgs: ChatMessage[] = Array.isArray(messages)
            ? (messages as any[]).map((m) => ({
                id: m.id,
                type: 'text_message',
                isSent: m.sender_id === currentUserId,
                status: 'accepted',
                timestamp: m.created_at,
                recordId: m.id,
                canTakeAction: false,
                content: m.content || '',
              }))
            : [];

          // Unread count: text messages from other after myLastReadAt
          let unreadCount = 0;
          if (Array.isArray(messages)) {
            if (myLastReadAt) {
              unreadCount = (messages as any[]).filter(
                (m: any) => m.message_type === 'text' && m.sender_id !== currentUserId && m.created_at > myLastReadAt
              ).length;
            } else {
              unreadCount = (messages as any[]).filter(
                (m: any) => m.message_type === 'text' && m.sender_id !== currentUserId
              ).length;
            }
          }

          setContacts((prev) => {
            // If contact exists, update; else insert placeholder and update
            const exists = prev.some((c) => c.userId === otherUserId);
            const updated = prev.map((c) => {
              if (c.userId !== otherUserId) return c;
              // Merge text messages; keep request-history already present
              const existingIds = new Set(c.messages.map((m) => m.id));
              const mergedMessages = [
                ...c.messages,
                ...textMsgs.filter((m) => !existingIds.has(m.id)),
              ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              return {
                ...c,
                messages: mergedMessages,
                conversationId,
                otherReadAt: otherReadAt ?? null,
                unreadCount,
                hasUnreadActivity: unreadCount > 0,
                lastActivity: last_message_at || c.lastActivity,
              } as Contact;
            });

            if (exists) {
              // Re-sort by lastActivity
              return [...updated].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
            }

            // Insert placeholder contact and let existing loaders fill profile
            const placeholder: Contact = {
              userId: otherUserId,
              profile: {
                id: otherUserId,
                user_id: otherUserId,
                first_name: '',
                last_name: '',
                gender: 'male',
              } as any,
              lastActivity: last_message_at || new Date().toISOString(),
              messages: textMsgs,
              hasUnreadActivity: unreadCount > 0,
              conversationId,
              otherReadAt: otherReadAt ?? null,
              unreadCount,
            };

            return [placeholder, ...updated].sort(
              (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            );
          });
        }
      );

    channel.subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [currentUserId]);

  // If a userId is passed via route (from matchdetails), ensure we open that conversation
  useEffect(() => {
    if (!currentUserId) return;
    const targetUserId = (params?.userId as string) || null;
    if (!targetUserId) return;

    // If not in contacts yet, add a placeholder and load
    setContacts(prev => {
      if (prev.some(c => c.userId === targetUserId)) return prev;
      const placeholder: Contact = {
        userId: targetUserId,
        profile: {
          id: targetUserId,
          user_id: targetUserId,
          first_name: '',
          last_name: '',
          gender: 'male',
        } as any,
        lastActivity: new Date().toISOString(),
        messages: [],
        hasUnreadActivity: false,
      };
      return [placeholder, ...prev];
    });

    // Load profile and messages, then select
    (async () => {
      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, age, profile_picture_url, gender, country, city')
          .eq('user_id', targetUserId)
          .limit(1);
        if (profiles && profiles.length > 0) {
          const p = profiles[0];
          setContacts(prev => prev.map(c => c.userId === targetUserId ? {
            ...c,
            profile: {
              id: p.user_id,
              user_id: p.user_id,
              first_name: p.first_name || '',
              last_name: p.last_name || '',
              age: p.age,
              profile_picture_url: p.profile_picture_url,
              gender: p.gender,
              country: p.country,
              city: p.city,
            }
          } : c));
        }
        setSelectedContactId(targetUserId);
        setTimeout(() => loadChatRef.current && loadChatRef.current(targetUserId), 0);
      } catch {}
    })();
  }, [currentUserId, params?.userId]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  // Send text message
  const handleSendMessage = useCallback(async () => {
    console.log('handleSendMessage called', { 
      selectedContact: selectedContact?.userId, 
      currentUserId, 
      newMessage: newMessage.trim(),
      conversationId: selectedContact?.conversationId,
      isSending 
    });

    if (!selectedContact || !currentUserId || !newMessage.trim() || isSending) {
      console.log('Validation failed - not sending message');
      return;
    }
    // Ensure conversation exists (just-in-time)
    try {
      if (!selectedContact.conversationId) {
        console.log('No conversation ID - creating one now');
        const convo = await ConversationsService.getOrCreateByOtherUser(currentUserId, selectedContact.userId);
        setContacts(prev => prev.map(c => c.userId === selectedContact.userId ? { ...c, conversationId: convo.id } : c));
      }
    } catch (e) {
      console.error('Failed to ensure conversation exists', e);
      Alert.alert(t('common.error'), 'Failed to start conversation');
      return;
    }

    // Gate: females unlimited; males require premium and 10 messages/day
    try {
      if (currentUserGender === 'male') {
        const allowedPackages = new Set(['premium', 'vip_premium', 'golden_premium']);
        if (!currentPackage || !allowedPackages.has(currentPackage)) {
          setShowUpgradeModal(true);
          return;
        }
        // Count today's sent messages (across all conversations)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: rows } = await supabase
          .from('conversations')
          .select('user_a,user_b,messages')
          .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`);
        const totalToday = (rows || []).reduce((sum: number, row: any) => {
          const msgs: any[] = row?.messages || [];
          const count = msgs.filter((m: any) => m.message_type === 'text' && m.sender_id === currentUserId && new Date(m.created_at).getTime() >= todayStart.getTime()).length;
          return sum + count;
        }, 0);
        if (totalToday >= 10) {
          setShowLimitModal(true);
          return;
        }
      }
    } catch {}

    setIsSending(true);
    try {
      console.log('Attempting to send message...');
      const message = await ConversationsService.sendText(
        (selectedContact.conversationId as string) || (contacts.find(c => c.userId === selectedContact.userId)?.conversationId as string), 
        currentUserId, 
        newMessage.trim()
      );

      // Add message to local state
      const newChatMessage: ChatMessage = {
        id: message.id,
        type: 'text_message',
        isSent: true,
        status: 'accepted',
        timestamp: message.created_at,
        recordId: message.id,
        canTakeAction: false,
        content: message.content || '',
      };

      setContacts(prev => prev.map(c => 
        c.userId === selectedContact.userId 
          ? { ...c, messages: [...c.messages, newChatMessage] }
          : c
      ));

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('common.error'), 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, currentUserId, newMessage, isSending, t]);

  // Handle request actions
  const handleAcceptRequest = async (message: ChatMessage) => {
    try {
      switch (message.type) {
        case 'photo_request_received':
          await InterestsService.accept(message.recordId);
          break;
        case 'video_request_received':
          await MeetService.accept(message.recordId);
          break;
        case 'message_request_received':
          await MessageRequestsService.accept(message.recordId);
          break;
      }
      
      // Refresh conversations
      loadConversations();
    } catch (error) {
      console.error('Failed to accept request:', error);
      Alert.alert(t('common.error'), 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (message: ChatMessage) => {
    try {
      switch (message.type) {
        case 'photo_request_received':
          await InterestsService.reject(message.recordId);
          break;
        case 'video_request_received':
          await MeetService.reject(message.recordId);
          break;
        case 'message_request_received':
          await MessageRequestsService.reject(message.recordId);
          break;
      }
      
      // Refresh conversations
      loadConversations();
    } catch (error) {
      console.error('Failed to reject request:', error);
      Alert.alert(t('common.error'), 'Failed to reject request');
    }
  };

  const handleVideoCall = (meetLink: string) => {
    if (Platform.OS === 'web') {
      window.open(meetLink, '_blank');
    } else {
      // For mobile, you might want to use Linking
      Alert.alert(t('match_details.video_meet'), `Video call link: ${meetLink}`);
    }
  };

  const handleWhatsAppChat = () => {
    // Navigate to WhatsApp chat or show contact info
    Alert.alert('Whatsapp', 'WhatsApp chat feature will be implemented here');
  };

  // Render contact item
  const renderContactItem = (contact: Contact) => {
    const fullName = `${contact.profile.first_name} ${contact.profile.last_name}`.trim();
    const lastMessage = contact.messages[contact.messages.length - 1];
    const isSelected = contact.userId === selectedContactId;

    return (
      <TouchableOpacity
        key={contact.userId}
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => {
          setSelectedContactId(contact.userId);
          setTimeout(() => loadChatForContact(contact.userId), 0);
        }}
      >
        <Image
          source={{ 
            uri: contact.profile.profile_picture_url || 
                 `https://via.placeholder.com/50x50/e8e8e8/666666?text=${contact.profile.first_name?.[0] || '?'}`
          }}
          style={styles.contactAvatar}
          contentFit="cover"
        />
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: COLORS.greyscale900 }]}>
            {fullName}
          </Text>
          <Text style={[styles.contactLastMessage, { color: COLORS.grayscale700 }]} numberOfLines={1}>
            {lastMessage ? getMessagePreview(lastMessage) : 'No messages'}
          </Text>
        </View>
        <View style={styles.contactMeta}>
          <Text style={[styles.contactTime, { color: COLORS.grayscale700 }]}>
            {formatTime(contact.lastActivity)}
          </Text>
          {contact.unreadCount > 0 && (
            <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{contact.unreadCount}</Text></View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Get message preview text
  const getMessagePreview = (message: ChatMessage): string => {
    switch (message.type) {
      case 'text_message':
        return message.isSent ? `You: ${message.content}` : message.content || 'Message';
      case 'photo_request_sent':
        return 'You: Photo request sent';
      case 'photo_request_received':
        return 'Photo request received';
      case 'photo_request_approved':
        return message.isSent ? 'You: Approved photo request' : 'Photo request approved';
      case 'video_request_sent':
        return 'You: Video call request sent';
      case 'video_request_received':
        return 'Video call request received';
      case 'video_request_approved':
        return message.isSent ? 'You: Approved video call' : 'Video call approved';
      case 'message_request_sent':
        return 'You: Whatsapp request sent';
      case 'message_request_received':
        return 'Whatsapp request received';
      case 'message_request_approved':
        return message.isSent ? 'You: Approved Whatsapp chat' : 'Whatsapp chat approved';
      default:
        return 'Message';
    }
  };

  // Format time
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Render message bubble
  const renderMessage = (message: ChatMessage) => {
    const isFromMe = message.isSent;
    const isText = message.type === 'text_message';
    
    return (
      <View 
        key={message.id}
        style={[
          styles.messageBubble,
          isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived
        ]}
      >
        <View style={styles.messageContent}>
          <Text style={[
            styles.messageText,
            { color: isFromMe ? COLORS.white : COLORS.greyscale900 }
          ]}>
            {getMessageText(message)}
          </Text>
          
          {message.scheduledAt && (
            <Text style={[
              styles.messageTime,
              { color: isFromMe ? 'rgba(255,255,255,0.8)' : COLORS.grayscale700 }
            ]}>
              Scheduled: {new Date(message.scheduledAt).toLocaleDateString()} {new Date(message.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
          
          <View style={styles.messageMetaRow}>
            <Text style={[
              styles.messageTime,
              { color: isFromMe ? 'rgba(255,255,255,0.8)' : COLORS.grayscale700 }
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isText && isFromMe && (
              <Text style={[styles.messageTicks, { color: isMessageRead(message) ? (COLORS.white) : (isFromMe ? 'rgba(255,255,255,0.8)' : COLORS.grayscale700) }]}>
                {isMessageRead(message) ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>

        {/* Action buttons for pending requests */}
        {message.canTakeAction && message.status === 'pending' && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(message)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectRequest(message)}
            >
              <Text style={[styles.actionButtonText, { color: COLORS.red }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Special actions for approved requests */}
        {message.status === 'accepted' && message.type === 'video_request_approved' && message.meetLink && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.videoCallButton]}
              onPress={() => handleVideoCall(message.meetLink!)}
            >
              <Image source={icons.videoCamera2} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Join Video Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {message.status === 'accepted' && message.type === 'message_request_approved' && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={handleWhatsAppChat}
            >
              <Image source={icons.chat} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Open Whatsapp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status indicator for request-related messages only (no ticks here) */}
        {message.type !== 'text_message' && (
          <View style={[
            styles.statusIndicator,
            message.status === 'accepted' && styles.statusAccepted,
            message.status === 'rejected' && styles.statusRejected,
            message.status === 'pending' && styles.statusPending
          ]}>
            <Text style={styles.statusText}>
              {message.status === 'accepted' ? '✓' : message.status === 'rejected' ? '✗' : '⏳'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Get message text based on type
  const getMessageText = (message: ChatMessage): string => {
    switch (message.type) {
      case 'text_message':
        return message.content || '';
      case 'photo_request_sent':
        return 'I sent a photo request';
      case 'photo_request_received':
        return 'I received a photo request from you';
      case 'photo_request_approved':
        return message.isSent 
          ? 'I approved your photo request' 
          : 'You approved my photo request';
      case 'video_request_sent':
        return 'I sent a video call request';
      case 'video_request_received':
        return 'I received a video call request from you';
      case 'video_request_approved':
        return message.isSent 
          ? 'I approved your video call request' 
          : 'You approved my video call request';
      case 'message_request_sent':
        return 'I sent a Whatsapp request';
      case 'message_request_received':
        return 'I received a Whatsapp request from you';
      case 'message_request_approved':
        return message.isSent 
          ? 'I approved your Whatsapp request' 
          : 'You approved my Whatsapp request';
      default:
        return 'Message';
    }
  };

  // Whether a sent message is read: message.created_at <= otherReadAt
  const isMessageRead = (message: ChatMessage): boolean => {
    if (!selectedContact) return false;
    if (!message.isSent) return false;
    if (!selectedContact.otherReadAt) return false;
    try {
      return new Date(message.timestamp).getTime() <= new Date(selectedContact.otherReadAt).getTime();
    } catch {
      return false;
    }
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          onPress={() => safeGoBack(navigation, router, '/(tabs)/home')} 
          style={styles.backButton}
        >
          <Image source={icons.back} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>
          Messenger
        </Text>
      </View>
      <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
        <Image source={icons.refresh} style={styles.refreshIcon} />
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image source={icons.chat} style={styles.emptyStateIcon} />
      <Text style={[styles.emptyStateTitle, { color: COLORS.greyscale900 }]}>
        No Conversations
      </Text>
      <Text style={[styles.emptyStateText, { color: COLORS.grayscale700 }]}>
        Your photo requests, video calls, and Whatsapp chats will appear here
      </Text>
    </View>
  );

  // Avoid blocking UI; show page immediately and load panes lazily

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      <StatusBar style="dark" />
      {renderHeader()}
      
      {contacts.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.content}>
          {/* Upgrade required modal */}
          {showUpgradeModal && (
            <View style={styles.inlineModalBackdrop}>
              <View style={styles.inlineModalCard}>
                <Text style={[styles.chatHeaderName, { textAlign: 'center', marginBottom: 8, color: COLORS.greyscale900 }]}>Upgrade Required</Text>
                <Text style={[styles.contactLastMessage, { textAlign: 'center', marginBottom: 16, color: COLORS.grayscale700 }]}>Please upgrade to Premium to send messages.</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => setShowUpgradeModal(false)}>
                    <Text style={[styles.actionButtonText, { color: COLORS.red }]}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.videoCallButton]} onPress={() => { setShowUpgradeModal(false); router.push('/membership'); }}>
                    <Text style={styles.actionButtonText}>Upgrade</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Daily limit reached modal */}
          {showLimitModal && (
            <View style={styles.inlineModalBackdrop}>
              <View style={styles.inlineModalCard}>
                <Text style={[styles.chatHeaderName, { textAlign: 'center', marginBottom: 8, color: COLORS.greyscale900 }]}>Daily Limit Reached</Text>
                <Text style={[styles.contactLastMessage, { textAlign: 'center', marginBottom: 16, color: COLORS.grayscale700 }]}>Please arrange a video call and WhatsApp communication to have quicker nikah inshaAllah.</Text>
                <TouchableOpacity style={[styles.actionButton, styles.videoCallButton]} onPress={() => setShowLimitModal(false)}>
                  <Text style={styles.actionButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Contacts List (lazy). On mobile, hide when a chat is open */}
          {(desktop || !selectedContact) && (
            <View style={[styles.contactsList, desktop && styles.contactsListDesktop]}>
              <ScrollView
                style={styles.contactsScroll}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={COLORS.primary}
                  />
                }
              >
                {contacts.length === 0 && isLoading && (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
                {contacts.map(renderContactItem)}
              </ScrollView>
            </View>
          )}

          {/* Chat Area */}
          {desktop ? (
            <View style={styles.chatArea}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <View style={styles.chatHeader}>
                    <Image
                      source={{ 
                        uri: selectedContact.profile.profile_picture_url || 
                             `https://via.placeholder.com/40x40/e8e8e8/666666?text=${selectedContact.profile.first_name?.[0] || '?'}`
                      }}
                      style={styles.chatHeaderAvatar}
                    />
                    <View style={styles.chatHeaderInfo}>
                      <Text style={[styles.chatHeaderName, { color: COLORS.greyscale900 }]}>
                        {`${selectedContact.profile.first_name} ${selectedContact.profile.last_name}`.trim()}
                      </Text>
                      <Text style={[styles.chatHeaderStatus, { color: COLORS.grayscale700 }]}>
                        {getTextMessageCountLabel(selectedContact)}
                      </Text>
                    </View>
                  </View>

                  {/* Messages (lazy) */}
                  <ScrollView style={styles.messagesScroll}>
                    <View style={styles.messagesContainer}>
                      {(messagesLoadingByUser[selectedContact.userId] && selectedContact.messages.length === 0) && (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      )}
                      {selectedContact.messages.map(renderMessage)}
                    </View>
                  </ScrollView>

                  {/* Message Input */}
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={[styles.messageInput, { color: COLORS.greyscale900 }]}
                      placeholder="Type a message..."
                      placeholderTextColor={COLORS.grayscale700}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!newMessage.trim() || isSending) && styles.sendButtonDisabled
                      ]}
                      onPress={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Image source={icons.send} style={styles.sendIcon} />
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.noChatSelected}>
                  <Text style={[styles.noChatText, { color: COLORS.grayscale700 }]}>
                    Select a conversation to view messages
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Mobile: Show chat full screen when contact is selected
            selectedContact && (
              <View style={styles.chatArea}>
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                  <TouchableOpacity 
                    onPress={() => setSelectedContactId(null)}
                    style={styles.chatBackButton}
                  >
                    <Image source={icons.back} style={styles.chatBackIcon} />
                  </TouchableOpacity>
                  <Image
                    source={{ 
                      uri: selectedContact.profile.profile_picture_url || 
                           `https://via.placeholder.com/40x40/e8e8e8/666666?text=${selectedContact.profile.first_name?.[0] || '?'}`
                    }}
                    style={styles.chatHeaderAvatar}
                  />
                  <View style={styles.chatHeaderInfo}>
                    <Text style={[styles.chatHeaderName, { color: COLORS.greyscale900 }]}>
                      {`${selectedContact.profile.first_name} ${selectedContact.profile.last_name}`.trim()}
                    </Text>
                    <Text style={[styles.chatHeaderStatus, { color: COLORS.grayscale700 }]}>
                      {getTextMessageCountLabel(selectedContact)}
                    </Text>
                  </View>
                </View>

                {/* Messages */}
                <ScrollView style={styles.messagesScroll}>
                  <View style={styles.messagesContainer}>
                    {selectedContact.messages.map(renderMessage)}
                  </View>
                </ScrollView>

                {/* Message Input */}
                <View style={styles.messageInputContainer}>
                  <TextInput
                    style={[styles.messageInput, { color: COLORS.greyscale900 }]}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.grayscale700}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!newMessage.trim() || isSending) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Image source={icons.send} style={styles.sendIcon} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.greyscale900,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  content: {
    flex: 1,
    flexDirection: isDesktopWeb() ? 'row' : 'column',
  },
  contactsList: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contactsListDesktop: {
    flex: 0.35,
    borderRightWidth: 1,
    borderRightColor: COLORS.grayscale200,
  },
  contactsScroll: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale100,
  },
  contactItemSelected: {
    backgroundColor: COLORS.tansparentPrimary,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    marginBottom: 4,
  },
  contactLastMessage: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
  },
  contactMeta: {
    alignItems: 'flex-end',
  },
  contactTime: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'bold',
  },
  inlineModalBackdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  inlineModalCard: {
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
  },
  chatArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  chatBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatBackIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS.greyscale900,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    marginBottom: 2,
  },
  chatHeaderStatus: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: COLORS.grayscale100,
  },
  messagesContainer: {
    padding: 16,
  },
  messageBubble: {
    marginVertical: 4,
    maxWidth: '80%',
    position: 'relative',
  },
  messageBubbleSent: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
  },
  messageContent: {
    padding: 12,
  },
  messageText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'medium',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'regular',
    marginTop: 4,
    textAlign: 'right',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  videoCallButton: {
    backgroundColor: COLORS.primary,
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  actionButtonIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -4,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusAccepted: {
    backgroundColor: COLORS.success,
  },
  statusRejected: {
    backgroundColor: COLORS.red,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'bold',
    color: COLORS.white,
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayscale100,
  },
  noChatText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    tintColor: COLORS.grayscale400,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    backgroundColor: COLORS.grayscale100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.grayscale300,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.white,
  },
});

export default Messenger;
