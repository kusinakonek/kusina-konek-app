import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../../lib/supabase';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

export interface MessageSender {
  userID: string;
  firstName: string;
  lastName: string;
  orgName: string | null;
  isOrg?: boolean;
}

export interface Message {
  messageID: string;
  disID: string;
  senderID: string;
  messageType: 'TEXT' | 'IMAGE';
  content: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: MessageSender | null;
  isSending?: boolean;
}

export function useRealtimeMessages(disID: string | null, userId: string = '') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);
  const channelRef = useRef<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages initially
  const fetchMessages = useCallback(async () => {
    if (!disID) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      if (!initialLoadDone.current) {
        setLoading(true);
      }
      setError(null);
      const response = await axiosClient.get(
        API_ENDPOINTS.MESSAGE.GET_BY_DISTRIBUTION(disID)
      );
      setMessages(response.data.messages || []);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [disID]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark messages as read when viewing the chat
  const markMessagesAsRead = useCallback(async () => {
    if (!disID || !userId) return;
    
    // Find unread messages from other users
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.senderID !== userId && !msg.isSending
    );
    
    if (unreadMessages.length === 0) return;
    
    try {
      // Mark each unread message as read
      await Promise.all(
        unreadMessages.map(msg =>
          axiosClient.patch(API_ENDPOINTS.MESSAGE.MARK_READ(msg.messageID))
        )
      );
      
      // Broadcast that messages were read
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { disID, readBy: userId },
        });
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        unreadMessages.some(u => u.messageID === msg.messageID)
          ? { ...msg, isRead: true }
          : msg
      ));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [disID, userId, messages]);

  // Mark messages as read when messages change or user views chat
  useEffect(() => {
    if (messages.length > 0 && userId) {
      markMessagesAsRead();
    }
  }, [messages.length, userId]);

  // Set up Realtime channel with Broadcast (presence handled globally)
  useEffect(() => {
    if (!disID || !userId) return;

    const channelName = `chat:${disID}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
      },
    });

    // Listen for new messages via broadcast
    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      console.log('[Broadcast] New message received:', payload);
      fetchMessages();
    });

    // Listen for message updates via broadcast
    channel.on('broadcast', { event: 'message_updated' }, (payload) => {
      console.log('[Broadcast] Message updated:', payload);
      fetchMessages();
    });

    // Listen for message deletions via broadcast
    channel.on('broadcast', { event: 'message_deleted' }, (payload) => {
      console.log('[Broadcast] Message deleted:', payload);
      fetchMessages();
    });

    // Listen for messages being read
    channel.on('broadcast', { event: 'messages_read' }, (payload) => {
      console.log('[Broadcast] Messages read:', payload);
      // Update local messages to show as read
      setMessages(prev => prev.map(msg => 
        msg.senderID === userId ? { ...msg, isRead: true } : msg
      ));
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('[Channel] Subscription status:', status);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.log('[Channel] Error, falling back to polling...');
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(() => {
            fetchMessages();
          }, 3000);
        }
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [disID, userId, fetchMessages]);

  // Handle app state changes for messages refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[Chat] App came to foreground - refreshing messages');
        fetchMessages();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchMessages]);

  // Broadcast helper function
  const broadcastEvent = useCallback(async (event: string, payload: any = {}) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  // Send text message
  const sendTextMessage = useCallback(
    async (content: string) => {
      if (!disID) {
        throw new Error('Distribution ID is required');
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      setSending(true);
      setError(null);

      // --- Optimistic UI Component ---
      const ghostId = `temp-${Date.now()}`;
      const ghostMessage: Message = {
        messageID: ghostId,
        disID,
        senderID: userId,
        messageType: 'TEXT',
        content: content.trim(),
        imageUrl: null,
        isRead: true,
        createdAt: new Date().toISOString(),
        sender: null,
        isSending: true,
      };
      
      // Push it to UI array immediately!
      setMessages(prev => [...prev, ghostMessage]);

      try {
        await axiosClient.post(API_ENDPOINTS.MESSAGE.SEND, {
          disID,
          messageType: 'TEXT',
          content: content.trim(),
        });
        
        // Broadcast to other users that a new message was sent
        await broadcastEvent('new_message', { disID, senderID: userId });
        
        // Refresh own messages
        await fetchMessages();
      } catch (err: any) {
        console.error('Failed to send message:', err);
        const errorMessage = err.response?.data?.error || 'Failed to send message';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setSending(false);
      }
    },
    [disID, userId, broadcastEvent, fetchMessages]
  );

  // Send image message
  const sendImageMessage = useCallback(
    async (imageBase64: string, caption?: string) => {
      if (!disID) {
        throw new Error('Distribution ID is required');
      }

      if (!imageBase64) {
        throw new Error('Image data is required');
      }

      setSending(true);
      setError(null);

      // --- Optimistic UI Component ---
      const ghostId = `temp-${Date.now()}`;
      const ghostMessage: Message = {
        messageID: ghostId,
        disID,
        senderID: userId,
        messageType: 'IMAGE',
        content: caption || null,
        imageUrl: imageBase64, // Local preview!
        isRead: true,
        createdAt: new Date().toISOString(),
        sender: null,
        isSending: true, // Activity spinner trigger
      };

      setMessages(prev => [...prev, ghostMessage]);

      try {
        await axiosClient.post(API_ENDPOINTS.MESSAGE.SEND, {
          disID,
          messageType: 'IMAGE',
          content: caption || null,
          imageBase64,
        });
        
        // Broadcast to other users
        await broadcastEvent('new_message', { disID, senderID: userId });
        
        await fetchMessages();
      } catch (err: any) {
        console.error('Failed to send image:', err);
        const errorMessage = err.response?.data?.error || 'Failed to send image';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setSending(false);
      }
    },
    [disID, userId, broadcastEvent, fetchMessages]
  );

  const editMessage = useCallback(async (messageID: string, newContent: string) => {
    try {
      setSending(true);
      await axiosClient.patch(API_ENDPOINTS.MESSAGE.EDIT(messageID), { content: newContent });
      
      // Broadcast update
      await broadcastEvent('message_updated', { messageID, disID });
      
      await fetchMessages();
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      throw new Error(err.response?.data?.error || 'Failed to edit message');
    } finally {
      setSending(false);
    }
  }, [disID, broadcastEvent, fetchMessages]);

  const deleteMessage = useCallback(async (messageID: string) => {
    try {
      setSending(true);
      await axiosClient.delete(API_ENDPOINTS.MESSAGE.DELETE(messageID));
      
      // Broadcast deletion
      await broadcastEvent('message_deleted', { messageID, disID });
      
      await fetchMessages();
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete message');
    } finally {
      setSending(false);
    }
  }, [disID, broadcastEvent, fetchMessages]);

  // Refresh messages manually
  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendTextMessage,
    sendImageMessage,
    editMessage,
    deleteMessage,
    refresh,
  };
}
