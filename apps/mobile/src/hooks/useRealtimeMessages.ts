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
}

export function useRealtimeMessages(disID: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

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

  // Set up rapid polling interval instead of blocked websocket
  useEffect(() => {
    if (!disID) return;

    // Fetch silently every 3 seconds!
    const intervalId = setInterval(() => {
        fetchMessages();
    }, 3000);

    return () => clearInterval(intervalId);
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

      try {
        await axiosClient.post(API_ENDPOINTS.MESSAGE.SEND, {
          disID,
          messageType: 'TEXT',
          content: content.trim(),
        });
        // Optimistically fetch immediately so sender sees it without waiting for socket
        fetchMessages();
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

      try {
        await axiosClient.post(API_ENDPOINTS.MESSAGE.SEND, {
          disID,
          messageType: 'IMAGE',
          content: caption || null,
          imageBase64,
        });
        // Optimistically fetch immediately so sender sees it without waiting for socket
        fetchMessages();
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
    refresh,
  };
}
