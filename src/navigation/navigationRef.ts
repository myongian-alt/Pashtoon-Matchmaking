import { createNavigationContainerRef } from '@react-navigation/native';

// Kept in its own file (rather than alongside RootStackParamList in
// AppNavigator.tsx) so non-screen modules like UserContext/authDeepLink can
// navigate imperatively (e.g. on a PASSWORD_RECOVERY auth event) without a
// circular import back into AppNavigator.
export const navigationRef = createNavigationContainerRef<any>();

// The auth listener can fire (e.g. a PASSWORD_RECOVERY event processed from
// the URL at client-init time) before NavigationContainer has mounted and
// called onReady - navigate() is a silent no-op until then, so queue the
// last request and flush it once the container actually is ready.
let pendingNavigation: { name: string; params?: object } | null = null;

export function navigateTo(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (...args: any[]) => void)(name, params);
  } else {
    pendingNavigation = { name, params };
  }
}

export function flushPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    pendingNavigation = null;
    (navigationRef.navigate as (...args: any[]) => void)(name, params);
  }
}
