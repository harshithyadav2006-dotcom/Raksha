# Raksha Nexus — Backend

This directory contains all backend/server-side configuration for the Raksha Nexus platform.

## Structure

```
backend/
├── .firebaserc          # Firebase project aliases
├── firebase.json        # Firebase service configuration
├── firestore.rules      # Firestore security rules
└── functions/           # Firebase Cloud Functions (Node.js/TypeScript)
    └── index.ts
```

## Firebase Services Used

| Service       | Purpose                                      |
|---------------|----------------------------------------------|
| Firebase Auth | Google Sign-In, user session management      |
| Firestore     | Real-time crisis reports, user data          |
| Cloud Functions | Server-side logic, push notifications      |

## Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
cd functions && npm install
firebase deploy --only functions
```
