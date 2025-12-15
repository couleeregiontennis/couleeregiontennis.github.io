## 2024-05-23 - AuthProvider Context Stability
**Learning:** `AuthProvider` was recreating its context `value` object on every render because `signOut` was an inline function and the object itself was not memoized. This caused all `useAuth` consumers to re-render whenever `AuthProvider` re-rendered (e.g., due to parent updates like theme toggle), even if authentication state hadn't changed.
**Action:** Always memoize context values (`useMemo`) and functions (`useCallback`) exposed via Context to prevent unnecessary re-renders in consumers.
