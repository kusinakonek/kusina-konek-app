import { HttpError } from "../middlewares/errorHandler";
import { distributionRepository, messageRepository, userRepository } from "../repositories";
import { uploadService } from "./uploadService";
import { safeDecrypt } from "../utils/encryption";

const verifyParticipant = async (disID: string, userID: string) => {
  const distribution = await distributionRepository.getById(disID);
  if (!distribution) {
    throw new HttpError(404, "Distribution not found");
  }

  const isParticipant =
    distribution.donorID === userID || distribution.recipientID === userID;

  if (!isParticipant) {
    throw new HttpError(403, "You are not a participant in this distribution");
  }

  return distribution;
};

const decryptSenderInfo = (sender: any) => {
  if (!sender) return null;
  return {
    ...sender,
    firstName: safeDecrypt(sender.firstName),
    lastName: safeDecrypt(sender.lastName),
    orgName: sender.orgName ? safeDecrypt(sender.orgName) : null,
  };
};

export const messageService = {
  async sendMessage(params: {
    userID: string;
    disID: string;
    messageType: "TEXT" | "IMAGE";
    content?: string;
    imageBase64?: string;
  }) {
    // Verify user is participant (donor or recipient)
    const distribution = await verifyParticipant(params.disID, params.userID);

    // Validate message content
    if (params.messageType === "TEXT") {
      if (!params.content || params.content.trim().length === 0) {
        throw new HttpError(400, "Text message content cannot be empty");
      }
      if (params.content.length > 2000) {
        throw new HttpError(400, "Message content exceeds 2000 characters limit");
      }
    } else if (params.messageType === "IMAGE") {
      if (!params.imageBase64) {
        throw new HttpError(400, "Image data is required for IMAGE message type");
      }
    }

    // Upload image if provided
    let imageUrl: string | undefined;
    if (params.imageBase64) {
      try {
        const uploaded = await uploadService.uploadImage({
          base64Image: params.imageBase64,
          bucket: "chat-images",
          userId: params.userID,
        });
        imageUrl = uploaded.url;
      } catch (error: any) {
        throw new HttpError(400, `Image upload failed: ${error.message}`);
      }
    }

    // Create message
    const message = await messageRepository.create({
      disID: params.disID,
      senderID: params.userID,
      messageType: params.messageType,
      content: params.content,
      imageUrl,
    });

    // Decrypt sender info for response
    const decryptedMessage = {
      ...message,
      sender: decryptSenderInfo(message.sender),
    };

    // Notify the other participant
    try {
      const otherParticipantID = distribution.donorID === params.userID ? distribution.recipientID : distribution.donorID;
      
      if (otherParticipantID) {
        const senderName = decryptedMessage.sender ? `${decryptedMessage.sender.firstName} ${decryptedMessage.sender.lastName}` : "Someone";
        const payloadBody = params.messageType === "IMAGE" ? "Sent an image" : params.content;
        
        const { notificationService } = await import("./notificationService");
        
        notificationService.notifyUser(
          otherParticipantID,
          "💬 New Message",
          `${senderName}: ${payloadBody}`,
          "NEW_MESSAGE",
          { screen: "Chat", disID: params.disID },
          params.disID
        ).catch((err) => console.error("Notify error:", err));
      }
    } catch (err) {
      console.error("Could not send chat notification:", err);
    }

    return { message: decryptedMessage };
  },

  async getMessages(params: { userID: string; disID: string }) {
    // Verify user is participant
    await verifyParticipant(params.disID, params.userID);

    // Get all messages for this distribution
    const messages = await messageRepository.getByDistribution(params.disID);

    // Decrypt sender info for all messages
    const decryptedMessages = messages.map((msg) => ({
      ...msg,
      sender: decryptSenderInfo(msg.sender),
    }));

    // Mark messages as read (messages from other user)
    await messageRepository.markAllAsRead(params.disID, params.userID);

    return { messages: decryptedMessages };
  },

  async markAsRead(params: { userID: string; messageID: string }) {
    // Get message to verify access
    const message = await messageRepository.getById(params.messageID);
    if (!message) {
      throw new HttpError(404, "Message not found");
    }

    // Verify user is participant of the distribution
    await verifyParticipant(message.disID, params.userID);

    // Only allow marking if user is NOT the sender
    if (message.senderID === params.userID) {
      throw new HttpError(403, "Cannot mark your own message as read");
    }

    await messageRepository.markAsRead(params.messageID);

    return { success: true };
  },

  async getUnreadCount(params: { userID: string; disID: string }) {
    // Verify user is participant
    await verifyParticipant(params.disID, params.userID);

    const count = await messageRepository.getUnreadCount(params.disID, params.userID);

    return { count };
  },

  async deleteMessage(params: { userID: string; messageID: string }) {
    const message = await messageRepository.getById(params.messageID);
    if (!message) throw new HttpError(404, "Message not found");
    if (message.senderID !== params.userID) throw new HttpError(403, "You can only delete your own messages");

    const messageAgeMs = Date.now() - new Date(message.createdAt).getTime();
    if (messageAgeMs > 2 * 60 * 1000) {
      throw new HttpError(403, "Messages can only be deleted within 2 minutes of sending");
    }

    await messageRepository.delete(params.messageID);
    return { success: true };
  },

  async editMessage(params: { userID: string; messageID: string; content: string }) {
    const message = await messageRepository.getById(params.messageID);
    if (!message) throw new HttpError(404, "Message not found");
    if (message.senderID !== params.userID) throw new HttpError(403, "You can only edit your own messages");

    const messageAgeMs = Date.now() - new Date(message.createdAt).getTime();
    if (messageAgeMs > 2 * 60 * 1000) {
      throw new HttpError(403, "Messages can only be edited within 2 minutes of sending");
    }
    
    if (message.messageType !== "TEXT") {
      throw new HttpError(400, "Only text messages can be edited");
    }

    if (!params.content || params.content.trim().length === 0) {
      throw new HttpError(400, "Text message content cannot be empty");
    }

    const updated = await messageRepository.update(params.messageID, params.content.trim());
    return { success: true, message: { ...updated, sender: decryptSenderInfo((updated as any).sender) } };
  },
};
