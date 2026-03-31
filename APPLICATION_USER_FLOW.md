# Kusina Konek App: User Flow & Features Guide

This document explains how the Kusina Konek application works, covering the main user flows and features from signup to logout, including role management, food donation/claiming, and notifications.

---

## 1. User Signup & Authentication

- **Signup:**
  - Users can register as a Donor or Recipient by providing required details (name, email, password, etc.).
  - Email verification is required to activate the account.
- **Login:**
  - Users log in with their email and password.
  - Forgot password and reset password flows are available.
- **Logout:**
  - Users can log out from the app at any time via the profile or settings section.

## 2. User Roles & Switching

- **Roles:**
  - Two main roles: Donor and Recipient.
  - Role is selected during signup but can be changed later in the profile/settings.
- **Changing Role:**
  - Users can switch roles (e.g., from Donor to Recipient) via the profile or settings page.
  - The app updates the UI and available features based on the selected role.

## 3. Donor Features

**Add Food Donation:**
  - Donors can add new food items for donation by providing basic details such as food name, description, quantity, and pickup location.
  - Optionally, a photo can be uploaded to help recipients identify the food.
  - Note: Donors cannot edit or delete food donations once submitted, and there is no option to set an expiration date. Once a food item is donated, it remains available until claimed by a recipient.
**View Donations:**
  - Donors can view a list of their active and past donations.
  - Donations are visible until claimed by a recipient. After claiming, the donation moves to the past donations list.
**Donation Feedback:**
  - Donors can receive feedback from recipients after food is claimed.

**How Food Donation Works:**
  1. Donor submits a food donation with required details.
  2. The donation is listed for recipients to browse.
  3. Once a recipient claims the food, the donor is notified and the item is no longer available for others.
  4. The donor cannot modify or remove the donation after submission.
  5. After the recipient picks up the food, feedback can be exchanged.

## 4. Recipient Features

- **Browse Available Food:**
  - Recipients can browse or search for available food donations.
  - Food items are shown with details and location (map view available).
- **Claim Food:**
  - Recipients can claim available food items.
  - Once claimed, the donor is notified and the item is reserved for the recipient.
- **View Claimed Foods:**
  - Recipients can view their claimed foods and pickup details.

## 5. Notifications

- **Push Notifications:**
  - Users receive notifications for important events:
    - New food donations (for recipients)
    - Food claimed (for donors)
    - Food ready for pickup
    - Feedback received
    - System messages (e.g., password reset, verification)
- **Notification Center:**
  - All notifications are accessible in the app’s notification tab.

## 6. Cart & Checkout (if applicable)

- **Cart:**
  - Recipients can add food items to their cart before claiming.
- **Checkout:**
  - Claiming food may involve a checkout process to confirm pickup details.

## 7. Profile & Settings

- **Edit Profile:**
  - Users can update their personal information, change password, and manage preferences.
- **Role Management:**
  - Switch between Donor and Recipient roles.
- **Logout:**
  - Option to securely log out of the application.

---

## 8. Additional Features

- **Feedback System:**
  - Recipients can leave feedback for donors after claiming food.
- **Food Map:**
  - Recipients can view available food donations on a map for easier location-based searching.
- **Alerts:**
  - Important alerts (e.g., expiring food, system updates) are shown in-app or via notifications.

---

## 9. Summary of Main Flows

1. **Signup → Email Verification → Login**
2. **Select/Change Role (Donor/Recipient)**
3. **Donor: Add Food → Wait for Claim → Get Notified → Provide Feedback**
4. **Recipient: Browse Food → Add to Cart → Claim Food → Pickup → Leave Feedback**
5. **Receive Notifications for all key events**
6. **Edit Profile/Logout as needed**

---

For more details on each feature, refer to the in-app help or the README files in the respective app folders.

---

## 10. Technologies Used

### Frontend
- Built with React Native (Expo) for mobile app development.
- Uses TypeScript for type safety and maintainability.
- Handles push notifications, authentication, and UI logic.

### Backend
- Node.js server (see apps/server) manages API endpoints and business logic.
- Uses Express.js for routing and middleware.
- Handles user authentication, food donation/claiming, notifications, and role management.

### Database
- Uses PostgreSQL via Prisma ORM for storing user, food, and transaction data.
- Database schema and migrations are managed in packages/database/prisma.

### Authentication & Cloud Services
- Firebase is used for authentication, push notifications, and some cloud functions.
- Firebase Admin SDK is used in the backend for secure operations.

### Encryption & Decryption
- Sensitive user data (such as passwords) is encrypted using industry-standard hashing (bcrypt or similar) before storage.
- Communication between frontend and backend is secured via HTTPS.
- Firebase authentication tokens are used to securely identify users and authorize actions.
- No manual encryption/decryption of food or transaction data; security relies on proper authentication and secure transport.

---

This section provides an overview of the main technologies and security practices used in the Kusina Konek app. For implementation details, see the README files and source code in the respective folders.
