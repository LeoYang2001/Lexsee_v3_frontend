# Redux State Management Setup

## Overview

This document outlines the Redux implementation for global state management in the LexSee v3 app, focusing on user authentication and profile data.

## Architecture

### Store Structure

```
store/
├── index.ts          # Main store configuration
├── hooks.ts          # Typed Redux hooks
└── slices/
    └── userSlice.ts  # User state management
```

### State Shape

```typescript
interface UserState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: string | null;
}

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  displayName?: string;
  // Extensible for future profile fields
}
```

## Implementation Details

### 1. Initial Setup (`app/index.tsx`)

- **Authentication Check**: On app launch, checks if user is authenticated
- **User Data Fetching**: If authenticated, fetches and stores user info in Redux
- **Global State**: User data becomes available across all components
- **Error Handling**: Handles authentication failures and redirects appropriately

### 2. User Slice (`store/slices/userSlice.ts`)

- **Async Thunks**:
  - `fetchUserInfo`: Fetches current user data from AWS Amplify
  - `fetchUserProfile`: Placeholder for future additional profile data
- **Synchronous Actions**:
  - `clearUser`: Clears user data on sign out
  - `updateUserProfile`: Updates user profile information
  - `setError/clearError`: Error state management

### 3. Global Usage

- **Home Screen**: Displays user info without additional API calls
- **Profile Screen**: Manages user profile with Redux state updates
- **Settings Screen**: Handles sign out with proper state cleanup

## Key Benefits

### ✅ Performance

- **Single Source of Truth**: User data fetched once and reused
- **No Redundant API Calls**: Eliminates multiple `getCurrentUser()` calls
- **Optimized Rendering**: Components only re-render when relevant state changes

### ✅ Scalability

- **Extensible Structure**: Easy to add new user-related data
- **Future-Ready**: Prepared for database-driven profile data
- **Modular Design**: Each slice handles specific state concerns

### ✅ Developer Experience

- **TypeScript Support**: Full type safety with typed hooks
- **Predictable Updates**: Redux DevTools compatibility
- **Centralized Logic**: All user state logic in one place

## Usage Examples

### Accessing User Data

```typescript
import { useAppSelector } from "../../store/hooks";

const { user, isAuthenticated, isLoading } = useAppSelector(
  (state) => state.user
);
```

### Updating User Profile

```typescript
import { useAppDispatch } from "../../store/hooks";
import { updateUserProfile } from "../../store/slices/userSlice";

const dispatch = useAppDispatch();
dispatch(updateUserProfile({ displayName: "New Name" }));
```

### Handling Sign Out

```typescript
import { useAppDispatch } from "../../store/hooks";
import { clearUser } from "../../store/slices/userSlice";

const dispatch = useAppDispatch();
await signOut();
dispatch(clearUser());
```

## Future Enhancements

### 🚀 Planned Features

1. **User Preferences**: Theme, language, notification settings
2. **Profile Images**: Avatar upload and management
3. **Database Integration**: User-specific data from backend
4. **Offline Support**: State persistence with Redux Persist
5. **Additional Slices**: Documents, cases, contacts, etc.

### 🔧 Extensibility Points

- **fetchUserProfile**: Ready for additional API calls
- **UserProfile Interface**: Easily extendable with new fields
- **Store Configuration**: Ready for additional slices and middleware

## Migration Notes

- **Before**: Each component called `getCurrentUser()` individually
- **After**: User data fetched once in `app/index.tsx` and shared globally
- **Breaking Changes**: Updated component imports to use Redux hooks
- **Performance Impact**: Significant reduction in API calls and improved UX

## File Changes Made

1. **Created**:
   - `store/index.ts`
   - `store/hooks.ts`
   - `store/slices/userSlice.ts`

2. **Modified**:
   - `app/_layout.tsx` - Added Redux Provider
   - `app/index.tsx` - Integrated Redux for auth flow
   - `app/(home)/index.tsx` - Using Redux user data
   - `app/(home)/profile.tsx` - Redux-based profile management
   - `app/(home)/settings.tsx` - Redux-based sign out
