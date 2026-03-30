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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Camera, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeMessages, Message } from '../../src/hooks/useRealtimeMessages';
import { wp, hp, fp } from '../../src/utils/responsive';
import axiosClient from '../../src/api/axiosClient';
import { API_ENDPOINTS } from '../../src/api/endpoints';

export default function Chat() {
  const { disID } = useLocalSearchParams<{ disID: string }>();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [donorName, setDonorName] = useState<string>('Chat');

  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { messages, loading, sending, error, sendTextMessage, sendImageMessage } =
    useRealtimeMessages(disID || null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch distribution to get donor name
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
        }
      } catch (err) {
        console.error('Failed to fetch distribution:', err);
      }
    };
    fetchDistribution();
  }, [disID]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (sending) return;

    try {
      if (selectedImage) {
        await sendImageMessage(selectedImage, inputText.trim() || undefined);
        setSelectedImage(null);
        setInputText('');
      } else if (inputText.trim()) {
        await sendTextMessage(inputText.trim());
        setInputText('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderID === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}>
        {!isOwnMessage && item.sender && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {item.sender.orgName || `${item.sender.firstName} ${item.sender.lastName}`}
          </Text>
        )}

        {item.messageType === 'IMAGE' && item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
        )}

        {item.content && (
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : colors.text },
            ]}>
            {item.content}
          </Text>
        )}

        <Text
          style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
          ]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const canSend = (inputText.trim().length > 0 || selectedImage) && !sending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {donorName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Chat about this food
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
            data={messages}
            keyExtractor={(item) => item.messageID}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Start a conversation with the donor about this food
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
            placeholder="Type a message..."
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
    </SafeAreaView>
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
});
