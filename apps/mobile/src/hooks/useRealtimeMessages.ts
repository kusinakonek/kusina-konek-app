import { useEffect, useState, useCallback, useRef } from 'react';
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

  // Set up Realtime subscription
  useEffect(() => {
    if (!disID) return;

    // Create channel for this distribution
    const channel = supabase
      .channel(`messages:${disID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `disID=eq.${disID}`,
        },
        () => {
          // Refetch messages when new message arrives
          fetchMessages();
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [disID, fetchMessages]);

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
        // Wait, just strictly call fetchMessages to override the ghost spinner instantly!
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
    [disID]
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
    [disID]
  );

  const editMessage = useCallback(async (messageID: string, newContent: string) => {
    try {
      setSending(true);
      await axiosClient.patch(API_ENDPOINTS.MESSAGE.EDIT(messageID), { content: newContent });
      await fetchMessages(); // immediately refresh
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      throw new Error(err.response?.data?.error || 'Failed to edit message');
    } finally {
      setSending(false);
    }
  }, [fetchMessages]);

  const deleteMessage = useCallback(async (messageID: string) => {
    try {
      setSending(true);
      await axiosClient.delete(API_ENDPOINTS.MESSAGE.DELETE(messageID));
      await fetchMessages(); // immediately refresh
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete message');
    } finally {
      setSending(false);
    }
  }, [fetchMessages]);

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
