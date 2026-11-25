# Crewdesk Mobile (iOS + Android)

React Native + TypeScript app (Expo SDK 58, Expo Router) that is a **second frontend for the existing Crewdesk system**.
It talks only to the existing FastAPI backend over HTTPS; it has no backend, database or auth store of its own.

```
   Crewdesk web (Vite/React)      Crewdesk mobile (this folder)
              \                        /
               └──── existing /api (FastAPI) ────┘
                              |
                     existing MySQL database
```

## 1. What was found (Phase 1)

| Area | Finding |
| --- | --- |
| `teamwork-com` | `../teamwork-com.docx`: 58 screenshots of the Teamwork.com Android app, no text. Used as the mobile UI/feature reference. |
| This folder on the Mac | Contained only that document. The Crewdesk code lives on the Windows PC (`E:\teamwork\crewdesk`). |
| Web frontend | Vite + React (JSX), `frontend/src`. Read through the running dev server. |
| Backend | FastAPI, all routes under `/api`. Health: `GET /api/health`. |
| Database / ORM | MySQL behind the backend. Not touched and never reached directly by the app. |
| Auth | `POST /api/auth/login {email,password}` → `{token, user}`; `GET /api/auth/me`; `Authorization: Bearer <token>`; no refresh token; logout is client-side; any 401 ends the session. Roles on `user.role` (`client` gets a restricted view). |
| State (web) | Plain `useData` fetch hook + context; no shared TS types (web is JS). |

Nothing in the backend or database was changed. Every endpoint the app calls is one the web app already calls.

## 2. Architecture

```
mobile/
├── src/
│   ├── app/                     # Expo Router routes (screens only)
│   │   ├── _layout.tsx          # providers + Stack with Stack.Protected auth guard
│   │   ├── login.tsx
│   │   ├── (tabs)/              # Home · Projects · Notifications · My work
│   │   ├── projects/[id]/       # overview, tasks, new-task, messages, files, milestones, activity, people
│   │   ├── tasks/[id].tsx       # task details, stage/priority, complete, comments
│   │   ├── messages/[id].tsx    # message thread + reply
│   │   └── activity, my-day, profile, settings
│   ├── components/              # shared design system
│   │   ├── ui/                  # AppText, AppButton, AppInput/AppTextArea, AppCard, AppBadge, AppChip(Group),
│   │   │                        # AppAvatar(Stack), AppCheckbox, AppSwitch, AppIcon, AppDivider, AppSearchBar, AppListItem
│   │   ├── layout/              # AppScreen (safe area + keyboard), AppSection
│   │   └── feedback/            # AppLoader, AppSkeleton, AppEmptyState, AppErrorState, AppToast, AppModal, QueryBoundary
│   ├── features/                # one module per domain: <x>Api.ts + hooks + components + index.ts
│   │   ├── auth/  tasks/  projects/  notifications/  activity/  home/  profile/
│   │   └── queryKeys.ts         # every TanStack Query key in one place
│   ├── services/
│   │   ├── api/                 # apiClient (base URL, bearer, timeout, safe GET retry, 401 handling), apiError
│   │   └── auth/tokenStorage.ts # Keychain / Keystore via expo-secure-store
│   ├── providers/QueryProvider.tsx
│   ├── theme/                   # tokens (Crewdesk accent #4461d7), light + dark, ThemeProvider
│   ├── types/models.ts          # typed API shapes (Task, Project, User, …)
│   └── utils/format.ts          # ported from web src/lib/format.js
├── tests/                       # Jest + Testing Library
├── app.json  .env.example  package.json  tsconfig.json
```

Decisions:
- **Expo (managed, CNG)**: no native code is needed; `ios/` and `android/` are generated, so one TS codebase builds both platforms.
- **Expo Router** for navigation (typed routes, deep links via the `crewdesk://` scheme, native Android back behaviour). React Navigation is used underneath; it is not installed separately.
- **TanStack Query** for server state (projects, tasks, inbox…), with invalidation after each write and refetch when the app returns to the foreground, so changes made on the web appear on mobile. Client state stays in component `useState`. No offline database.
- **Secure token storage**: the same bearer token the web keeps in `localStorage` is kept in the OS keychain/keystore.
- **Shared code with web**: the web app is JavaScript with no types, so formatting helpers, priority/health/status constants and the My work bucketing rules were ported into typed modules here rather than imported. A `packages/shared` package can be extracted later if the web moves to TypeScript.

## 3. Features (mapped to existing Crewdesk endpoints)

| Feature | Endpoints |
| --- | --- |
| Login, session restore, logout | `POST /auth/login`, `GET /auth/me` |
| Home: views, recent projects (topped up with active projects), quick add (+) | `GET /recent?kind=project`, `GET /projects`, `POST /recent` on project open |
| Search (tasks, projects, messages, people) | `GET /search?q=` |
| My work (All/Today/Late/Upcoming/Completed), My day | `GET /tasks?assignee=…&status=…` |
| Projects: search, status, category filter, sort, star | `GET /projects?status=…`, `GET /r/categories`, `PATCH /projects/:id {is_starred}` |
| Project overview & progress | `GET /projects/:id` |
| Task lists with filters, complete/reopen | `GET /projects/:id/tasklists`, `PATCH /tasks/:id` |
| Board with move between columns | `GET /projects/:id/board`, `POST /tasks/:id/move?column_id=` |
| Create task (list, priority, assignees, start/due date pickers) | `POST /projects/:id/tasks`, `GET /projects/:id/people` |
| Task details: edit title/description, stage, priority, dates, assignees, subtasks, log time, files, comments | `GET/PATCH /tasks/:id`, `POST /projects/:id/tasks {parent_id}`, `POST /time`, `POST /tasks/:id/comments` |
| Messages: list, read, reply, new | `GET/POST /projects/:id/messages`, `GET /messages/:id`, `POST /messages/:id/replies` |
| Files: list, upload, open/preview | `GET/POST /projects/:id/files`, `GET /files/:id/download` |
| Notebooks: list, read, add, edit | `GET/POST/PATCH /r/notebooks` |
| Milestones, project activity, people | `GET /projects/:id/milestones|activity|people` |
| Activity with user filter | `GET /activity` |
| Notifications: unread/read, open target, mark all read, tab badge, Catch me up (AI) | `GET /inbox2`, `POST /inbox/:id/read`, `POST /inbox/read-all`, `GET /inbox/count`, `POST /ai/ask` |
| Profile, Time (weekly/monthly/quarterly chart + entries) | `GET /people/:id`, `GET /time?user_id=…&start=…&end=…` |
| Deep links | `crewdesk://projects/14/files`, `crewdesk://tasks/182`, … |

## 4. Setup and running

Requirements: Node 20+, Android Studio (SDK + an emulator) for Android, Xcode 16+ for iOS.

```bash
cd mobile
npm install
cp .env.example .env      # then set EXPO_PUBLIC_API_URL
```

`EXPO_PUBLIC_API_URL` must be the backend's `/api` base URL as seen **from the phone**:
- through the ngrok tunnel to the PC's Vite server: `https://<tunnel>.ngrok-free.dev/api`
- on the same Wi-Fi, straight to FastAPI: `http://<PC-LAN-IP>:8010/api` (open port 8010 in Windows Firewall)
- production: the HTTPS URL of the deployed API

Android (emulator running, or a phone with USB debugging):
```bash
npx expo run:android
```

iOS (needs Xcode on the Mac):
```bash
npx expo run:ios
```

Day-to-day after the first native build: `npx expo start` and press `a` / `i`.
Cloud builds without local Xcode: `npx eas-cli@latest build -p ios --profile development`.

## 5. Quality checks

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # expo lint (eslint-config-expo)
npm test            # jest-expo + @testing-library/react-native
```

## 6. Testing done (Android emulator, live Crewdesk data through the tunnel)

Signed in as a real member account and exercised every screen: Home/Recents, Search, quick add, Projects (star, sort,
category), project overview, Task Lists, Board (moved a card), new task, task details (edit, comment, subtask, log 30m,
dates, stage), Messages (post + reply), Files (upload + open), Notebooks (add + view), Milestones, Activity, Notifications
with Catch me up, Profile, Time charts, Settings, session restore and deep links. Writes were made only in "test project".
Unit tests: 19 passing (`npm test`). Type-check and lint clean.

## 7. Known limitations

- **iOS has not been built or run**: this Mac has no Xcode. Install Xcode, then `npx expo run:ios` (or use EAS cloud builds).
- **Backend timestamps are inconsistent**: most endpoints return server-local times without a zone (the app reads them as
  local time), but `/recent` `viewed_at` is stored in UTC, so Home Recents shows order only, not "x minutes ago".
- No push notifications: the backend has no push service; notifications are in-app (badge refreshes every minute).
- The reference app's Shortcuts, Home customisation, account switcher and Feedback have no Crewdesk backend support, so
  they were not built. Milestones are read-only on mobile.
- The dev build needs Metro: after `npx expo run:android`, keep `npx expo start` running (or make a release build).
