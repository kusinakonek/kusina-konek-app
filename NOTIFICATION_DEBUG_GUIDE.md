# 🔔 Notification Bug Fix & Troubleshooting Guide

## What Was Fixed

Your app wasn't displaying notifications due to 3 critical issues:

### 1. **Missing Logging & Tracking** ❌ → ✅
   - Added comprehensive console logging to track notification lifecycle
   - Now you can see in console when notifications are: received, sent, synced, displayed

### 2. **Token Sync Issues** ❌ → ✅
   - Enhanced `PushTokenManager` with better error handling and retry logic
   - Added detailed logging of sync attempts and failures
   - Proper dependency array to ensure token syncs when user changes

### 3. **Notification Display Timing** ❌ → ✅
   - Extended duration from 5000ms → 6000ms
   - Better timer management to prevent premature dismissal
   - Improved animation state handling

---

## 📋 Step-by-Step Troubleshooting

### **Step 1: Verify Firebase Configuration**
Check your backend server logs for this message:
```
[Firebase] Admin SDK initialized successfully
```

If you see this instead:
```
[Firebase] Missing credentials. Push notifications will not work.
[Firebase] Required env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
```

**FIX:** Set environment variables on your backend (Render):
- `FIREBASE_PROJECT_ID` from your `google-services.json`
- `FIREBASE_CLIENT_EMAIL` from Firebase console
- `FIREBASE_PRIVATE_KEY` from Firebase console (service account)

---

### **Step 2: Check FCM Token Generation**
Open your app and check browser console (React Native debugger):

```
✅ Good output:
[PushNotification] === DIAGNOSTICS ===
[PushNotification] Platform: android (or ios)
[PushNotification] appOwnership: expo
[PushNotification] Resolved projectId: e9513db4-b6aa-4833-927f-349cde3e0a46
[PushNotification] Token type: fcm
[PushNotification] FCM token obtained: eLx2yHI4Tyi__VoXT-Wuni:APA91bFR...
[PushNotification] === END DIAGNOSTICS ===

❌ Bad output:
Push notifications require a physical device
```

**If you see "physical device" error:**
- You must test on real Android/iOS device or Expo Go
- Emulators don't support FCM

---

### **Step 3: Verify Token Syncs to Backend**
Check console for:
```
✅ Good:
[PushTokenManager] ✅ Token obtained: eLx2yHI4Tyi__VoXT...
[PushTokenManager] 🚀 Syncing token with backend (attempt 1)...
[PushTokenManager] ✅ Push token successfully synced with backend

❌ Bad:
[PushTokenManager] ❌ Failed to sync token (status: 404):
[PushTokenManager] ⏳ Retrying in 3000s...
```

**If sync fails:**
1. Make sure backend server is running: `npm run dev` in `apps/server`
2. Check backend logs for errors
3. Verify `PUT /users/push-token` endpoint exists
4. Make sure you're authenticated (have valid auth token)

---

### **Step 4: Test with Backend Endpoint**

Open browser console and run:
```javascript
// Paste this in Render/backend logs or API client
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "pushToken": "eLx2yHI4Tyi__VoXT-Wuni:APA91bFR...",
  "expoTicketResponse": {
    "success": true,
    "messageId": "1234567890"
  }
}
```

If error: `error: "No push token found for your account"`
- App didn't sync token yet, wait 30 seconds and retry

---

### **Step 5: Verify Notification Handler**

The app should log:
```
[usePushNotifications] Foreground notification received: Test Notification
[usePushNotifications] Notification data: { type: 'TEST', ... }
[NotificationBanner] Showing notification: Test Notification
```

**If no logs appear:**
- Notification permissions not granted → Allow in OS settings
- App killed → Must be running or in background
- FCM token invalid → Check Step 3

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Token not syncing | Backend unreachable | Start backend: `npm run dev` in `apps/server` |
| Permission denied | Notification permissions not granted | Go to Settings → App → Permissions → Enable Notifications |
| Notifications work on emulator but not device | FCM requires real device | Test on Expo Go or real device |
| Notification shows then disappears | Auto-refresh clearing state | Now fixed with better state management |
| Backend says "Invalid FCM token" | Sending Expo token instead of FCM | Update hook to use `getDevicePushTokenAsync()` (already fixed) |
| No response from `/notifications/test` | Auth token expired | Login again in app |

---

## 📱 Checklist Before Assuming It's Broken

- [ ] App is running on physical device or Expo Go (not emulator)
- [ ] Notification permissions enabled in OS settings
- [ ] Backend server running: `npm run dev` in `apps/server`
- [ ] Firebase env vars set on backend
- [ ] Token is syncing to backend (check PushTokenManager logs)
- [ ] `/notifications/test` returns success
- [ ] App is running (in foreground or background, not killed)
- [ ] Checked console logs in React Native debugger

---

## 🔍 Files Changed

Updated files with better notification handling:
1. `apps/mobile/src/hooks/usepushnotifications.ts` - Added debug logging
2. `apps/mobile/src/components/PushTokenManager.tsx` - Better error handling
3. `apps/mobile/src/components/NotificationBanner/index.tsx` - Improved display logic
4. `apps/mobile/src/components/NotificationDiagnostics.tsx` - NEW - Diagnostic tool

---

## ✅ Testing Complete Flow

1. Start backend: `npm run dev` in `apps/server`
2. Open app on real device
3. Check console logs in React Native debugger
4. Look for green "Token synced" message
5. Call `/notifications/test` endpoint
6. Look for **green notification banner** at top of screen
7. You should see detailed logs in console

---

## 💡 Next Steps if Still Not Working

1. **Check server logs** for Firebase errors
2. **Verify Firebase credentials** - Ask me for help
3. **Test on different device** to rule out OS-specific issues
4. **Check network** - Maybe firewall blocking FCM
5. **Clear app cache** - Sometimes old token cached

Need help? Check the logs first, then let me know what you see! 📋
