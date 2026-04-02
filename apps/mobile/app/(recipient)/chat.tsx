import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Camera, X, Image as ImageIcon, Reply, Trash2, Edit2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../context/PresenceContext';
import { useRealtimeMessages, Message } from '../../src/hooks/useRealtimeMessages';
import { wp, hp, fp } from '../../src/utils/responsive';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';

export default function Chat() {
  const { disID } = useLocalSearchParams<{ disID: string }>();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [donorName, setDonorName] = useState<string>('Chat');
  const [donorId, setDonorId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [activeMessageOptions, setActiveMessageOptions] = useState<Message | null>(null);

  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { isUserOnline, getUserLastSeen } = usePresence();
  const { messages, loading, sending, error, sendTextMessage, sendImageMessage, editMessage, deleteMessage } =
    useRealtimeMessages(disID || null, user?.id || '');
  const flatListRef = useRef<FlatList>(null);

  const canSend = (inputText.trim().length > 0 || selectedImage !== null) && !sending;
  const visibleMessages = messages.filter((message) => {
    const content = message.content || '';
    const isBotSeed = content.startsWith('[KusinaKonek Bot]');
    if (!isBotSeed) return true;

    // Hide bot seed messages that were authored with the current user's ID.
    return message.senderID !== user?.id;
  });
  
  // Get other user's online status from global presence
  const otherUserOnline = donorId ? isUserOnline(donorId) : false;
  const otherUserLastSeen = donorId ? getUserLastSeen(donorId) : null;

  // Fetch distribution to get donor name and ID
  useEffect(() => {
    const fetchDistribution = async () => {
      if (!disID) return;
      try {
        const response = await axiosClient.get(
          API_ENDPOINTS.DISTRIBUTION.GET_BY_ID(disID)
        );
        const dist = response.data.distribution;
        if (dist?.donor) {
          const name = dist.donor.orgName || `${dist.donor.firstName} ${dist.donor.lastName}`;
          setDonorName(name);
          setDonorId(dist.donor.userID || dist.donor.id);
        }
      } catch (err) {
        console.error('Failed to fetch distribution:', err);
      }
    };
    fetchDistribution();
  }, [disID]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (visibleMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visibleMessages.length]);

  const handleSend = async () => {
    if (sending) return;

    try {
      if (editingMessage) {
        let finalContent = inputText.trim();
        // Preserve reply context if it was a reply
        if (editingMessage.content?.startsWith('>> ')) {
          const parts = editingMessage.content.split('\n');
          if (parts.length > 1) {
            finalContent = `${parts[0]}\n${finalContent}`;
          }
        }
        await editMessage(editingMessage.messageID, finalContent);
        setEditingMessage(null);
        setInputText('');
        return;
      }

      if (selectedImage) {
        await sendImageMessage(selectedImage, inputText.trim() || undefined);
        setSelectedImage(null);
        setInputText('');
      } else if (inputText.trim()) {
        let finalContent = inputText.trim();
        if (replyingTo) {
          const author = replyingTo.sender?.orgName || (replyingTo.sender ? `${replyingTo.sender.firstName} ${replyingTo.sender.lastName}` : 'Someone');
          const quoted = replyingTo.content || '[Image]';
          finalContent = `>> ${author}: ${quoted}\n${finalContent}`;
          setReplyingTo(null);
        }
        await sendTextMessage(finalContent);
        setInputText('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process message');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const base64String = `data:${mimeType};base64,${result.assets[0].base64}`;
        setSelectedImage(base64String);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const base64String = `data:${mimeType};base64,${result.assets[0].base64}`;
        setSelectedImage(base64String);
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const handleLongPress = (message: Message) => {
    setActiveMessageOptions(message);
  };

  const handleDeleteMessage = (messageID: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => deleteMessage(messageID).catch(e => Alert.alert('Error', e.message))
      }
    ]);
  };

  const renderLeftActions = (progress: any, dragX: any, message: Message) => {
    const isOwn = message.senderID === user?.id;
    if (isOwn) return null; // Swipe left-to-right is for OTHER messages only
    
    return (
      <View style={styles.swipeActionLeft}>
        <Reply size={24} color={colors.primary} />
      </View>
    );
  };

  const renderRightActions = (progress: any, dragX: any, message: Message) => {
    const isOwn = message.senderID === user?.id;
    if (!isOwn) return null; // Swipe right-to-left is for OWN messages only
    
    return (
      <View style={styles.swipeActionRight}>
        <Reply size={24} color={colors.primary} />
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageItem 
      item={item} 
      userID={user?.id} 
      colors={colors} 
      isDark={isDark}
      onReply={(msg) => {
        setReplyingTo(msg);
        setEditingMessage(null);
      }}
      onLongPress={handleLongPress}
      onZoom={setZoomedImage}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {donorName}
            </Text>
            <View style={[styles.onlineIndicator, { backgroundColor: otherUserOnline ? '#4CAF50' : '#9E9E9E' }]} />
          </View>
          <Text style={[styles.headerSubtitle, { color: otherUserOnline ? '#4CAF50' : colors.textSecondary }]}>
            {otherUserOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: (colors as any).error || 'red' }]}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={visibleMessages}
            keyExtractor={(item) => item.messageID}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Start a conversation with the donor about this food. Coordinate pickup times and locations here!
                </Text>
              </View>
            }
          />
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={[styles.imagePreview, { backgroundColor: colors.card }]}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <Pressable
              style={[styles.removeImageButton, { backgroundColor: (colors as any).error || 'red' }]}
              onPress={() => setSelectedImage(null)}>
              <X size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Reply/Edit Banner */}
        {(replyingTo || editingMessage) && (
          <View style={[styles.actionBanner, { backgroundColor: isDark ? '#222' : '#f0f0f0', borderTopColor: colors.border }]}>
            <View style={styles.actionInfo}>
              <View style={[styles.actionIndicator, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: colors.primary }]}>
                  {editingMessage ? 'Editing Message' : `Replying to ${replyingTo?.sender?.orgName || (replyingTo?.sender ? `${replyingTo.sender.firstName}` : 'Someone')}`}
                </Text>
                <Text numberOfLines={1} style={[styles.actionText, { color: colors.textSecondary }]}>
                  {editingMessage ? editingMessage.content : (replyingTo?.content || '[Image]')}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => { setReplyingTo(null); setEditingMessage(null); if(editingMessage) setInputText(''); }}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Pressable style={styles.attachButton} onPress={handlePickImage}>
            <ImageIcon size={24} color={colors.primary} />
          </Pressable>

          <Pressable style={styles.attachButton} onPress={handleTakePhoto}>
            <Camera size={24} color={colors.primary} />
          </Pressable>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? colors.background : '#f5f5f5',
                color: colors.text,
              },
            ]}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />

          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: canSend ? colors.primary : colors.border },
            ]}
            onPress={handleSend}
            disabled={!canSend}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Message Options Modal */}
      <Modal
        visible={!!activeMessageOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveMessageOptions(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setActiveMessageOptions(null)}
        >
          {activeMessageOptions && (
            <Reanimated.View 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[styles.optionsContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            >
              <View style={styles.optionsHeader}>
                <Text style={[styles.optionsHeaderTitle, { color: colors.textSecondary }]}>
                  Message Options
                </Text>
                <View style={[styles.optionsHeaderLine, { backgroundColor: colors.border }]} />
              </View>

              <Pressable 
                style={styles.optionRow}
                onPress={() => {
                  setReplyingTo(activeMessageOptions);
                  setEditingMessage(null);
                  setActiveMessageOptions(null);
                }}
              >
                <Reply size={20} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Reply</Text>
              </Pressable>

              {activeMessageOptions.senderID === user?.id && 
               (Date.now() - new Date(activeMessageOptions.createdAt).getTime() < 120000) && 
               activeMessageOptions.messageType === 'TEXT' && (
                <Pressable 
                  style={styles.optionRow}
                  onPress={() => {
                    setEditingMessage(activeMessageOptions);
                    setReplyingTo(null);
                    // Strip the quote if it's a reply
                    const content = activeMessageOptions.content || '';
                    const editContent = content.includes('\n') && content.startsWith('>> ') 
                      ? content.split('\n').slice(1).join('\n') 
                      : content;
                    setInputText(editContent);
                    setActiveMessageOptions(null);
                  }}
                >
                  <Edit2 size={20} color="#2196F3" />
                  <Text style={[styles.optionText, { color: colors.text }]}>Edit Message</Text>
                </Pressable>
              )}

              {activeMessageOptions.senderID === user?.id && 
               (Date.now() - new Date(activeMessageOptions.createdAt).getTime() < 120000) && (
                <Pressable 
                  style={styles.optionRow}
                  onPress={() => {
                    handleDeleteMessage(activeMessageOptions.messageID);
                    setActiveMessageOptions(null);
                  }}
                >
                  <Trash2 size={20} color="#F44336" />
                  <Text style={[styles.optionText, { color: '#F44336' }]}>Delete Message</Text>
                </Pressable>
              )}

              <View style={[styles.optionsSeparator, { backgroundColor: colors.border }]} />

              <Pressable 
                style={[styles.optionRow, { marginBottom: 8 }]}
                onPress={() => setActiveMessageOptions(null)}
              >
                <X size={20} color={colors.textTertiary} />
                <Text style={[styles.optionText, { color: colors.textTertiary }]}>Cancel</Text>
              </Pressable>
            </Reanimated.View>
          )}
        </Pressable>
      </Modal>

      {/* Zoomed Image Modal */}
      <Modal visible={!!zoomedImage} transparent={true} animationType="fade" onRequestClose={() => setZoomedImage(null)}>
        <View style={styles.modalBackground}>
          <Pressable style={styles.modalCloseArea} onPress={() => setZoomedImage(null)} />
          <Image source={{ uri: zoomedImage || undefined }} style={styles.modalImage} resizeMode="contain" />
          <Pressable style={styles.modalCloseButton} onPress={() => setZoomedImage(null)}>
            <X size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

interface MessageItemProps {
  item: Message;
  userID: string | undefined;
  colors: any;
  isDark: boolean;
  onReply: (msg: Message) => void;
  onLongPress: (msg: Message) => void;
  onZoom: (url: string) => void;
}

// Separate component to handle swipeable refs
function MessageItem({ item, userID, colors, isDark, onReply, onLongPress, onZoom }: MessageItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const isOwnMessage = item.senderID === userID;
  const botPrefix = '[KusinaKonek Bot]';

  // Parse reply if present
  let displayContent = item.content || '';
  let replyPart = null;

  const isBotMessage = displayContent.startsWith(botPrefix);
  if (isBotMessage) {
    displayContent = displayContent.replace(botPrefix, '').trim();
  }

  if (displayContent.startsWith('>> ')) {
    const parts = displayContent.split('\n');
    if (parts.length > 1) {
      replyPart = parts[0].substring(3);
      displayContent = parts.slice(1).join('\n');
    }
  }

  const renderLeftActions = () => {
    if (isOwnMessage) return null;
    return (
      <View style={styles.swipeActionLeft}>
        <Reply size={24} color={colors.primary} />
      </View>
    );
  };

  const renderRightActions = () => {
    if (!isOwnMessage) return null;
    return (
      <View style={styles.swipeActionRight}>
        <Reply size={24} color={colors.primary} />
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={!isOwnMessage ? renderLeftActions : undefined}
      renderRightActions={isOwnMessage ? renderRightActions : undefined}
      onSwipeableOpen={() => {
        onReply(item);
        swipeableRef.current?.close();
      }}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
    >
      <Pressable
        onLongPress={() => onLongPress(item)}
        delayLongPress={300}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : [styles.otherMessage, { backgroundColor: isDark ? '#333' : '#e9e9e9' }],
        ]}>
        {!isOwnMessage && item.sender && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {isBotMessage
              ? 'KusinaKonek Bot'
              : (item.sender.orgName || `${item.sender.firstName} ${item.sender.lastName}`)}
          </Text>
        )}

        {replyPart && (
          <View style={[styles.replyQuote, { 
            backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)', 
            borderLeftColor: isOwnMessage ? '#fff' : colors.primary,
            borderLeftWidth: 3,
          }]}>
            <Text numberOfLines={1} style={[styles.replyQuoteText, { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
              {replyPart}
            </Text>
          </View>
        )}

        {item.messageType === 'IMAGE' && item.imageUrl && (
          <Pressable onPress={() => onZoom(item.imageUrl!)}>
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
          </Pressable>
        )}

        {displayContent ? (
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : colors.text },
            ]}>
            {displayContent}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 }}>
          {item.isSending && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginRight: 2 }} />
          )}
          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary, marginTop: 0 },
            ]}>
            {item.isSending ? 'Sending...' : new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {/* Show seen status for own messages */}
          {isOwnMessage && !item.isSending && item.isRead && (
            <Text style={{ color: '#4FC3F7', fontSize: 11, fontWeight: '500' }}>Seen</Text>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9e9e9',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  imagePreview: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  swipeActionLeft: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionRight: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  optionsContainer: {
    borderRadius: 24,
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  optionsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionsHeaderLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  optionsSeparator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  attachButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    marginHorizontal: 8,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  replyQuote: {
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  replyQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  actionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIndicator: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionText: {
    fontSize: 14,
  },
});
