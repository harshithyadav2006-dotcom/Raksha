# Raksha Nexus — Frontend

React + Vite + TypeScript web application for the Raksha Nexus safety platform.

## Structure

```
src/
├── components/
│   ├── admin/              # Admin dashboard components
│   │   ├── AnalyticsRow.tsx
│   │   ├── CCTVIntegration.tsx
│   │   └── IncidentManagementTable.tsx
│   ├── women/              # Women safety feature components
│   │   ├── AudioRecording.tsx
│   │   ├── GPSLocationCard.tsx
│   │   ├── GuardianContacts.tsx
│   │   ├── HiddenCamera.tsx
│   │   ├── PoliceLocator.tsx
│   │   └── SafeRoute.tsx
│   ├── AIEmergencyChatbot.tsx
│   ├── AnimatedHeading.tsx
│   ├── AppShell.tsx
│   ├── FadeIn.tsx
│   ├── ProtectedRoute.tsx
│   └── ReportIncidentModal.tsx
├── contexts/
│   └── AuthContext.tsx      # Firebase auth context
├── hooks/                   # Custom React hooks
├── pages/
│   ├── AIIntelligence.tsx
│   ├── AdminPanel.tsx
│   ├── AdvancedSettings.tsx
│   ├── CrisisResponse.tsx
│   ├── Dashboard.tsx
│   ├── Hero.tsx
│   ├── Login.tsx
│   ├── OfflineMesh.tsx
│   ├── PublicTools.tsx
│   ├── Settings.tsx
│   └── WomenSafety.tsx
├── store/
│   └── reportStore.ts       # State store for reports
├── firebase.ts              # Firebase SDK initialization
├── App.tsx
└── main.tsx
```

## Development

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Build for production
npm run preview   # Preview production build
```
