# Model Configuration Caching Implementation

## Overview
Implemented intelligent caching for the Model Configuration page to reduce unnecessary API calls and improve performance.

## Features Implemented

### 1. **React Query Caching**
Both API endpoints now use React Query's built-in caching mechanism:

#### `/api/v1/models` Endpoint
- **Cache Key**: `['available-models']`
- **Stale Time**: 5 minutes (data considered fresh for 5 minutes)
- **Garbage Collection Time**: 10 minutes (data kept in memory for 10 minutes)
- **Behavior**: 
  - First load: Fetches from server
  - Subsequent loads within 5 minutes: Uses cached data instantly
  - After 5 minutes: Refetches in background while showing cached data
  - After 10 minutes of inactivity: Cache cleared from memory

#### `/api/workspace/model-config` Endpoint
- **Cache Key**: `['model-config', workspaceId]`
- **Stale Time**: 5 minutes
- **Garbage Collection Time**: 10 minutes
- **Behavior**: Same as above, with workspace-specific caching

### 2. **Cache Invalidation Strategy**

#### On Save Operation
```typescript
saveMutation.onSuccess: () => {
  // Invalidates cache and triggers refetch
  queryClient.invalidateQueries({ queryKey: ['model-config', workspaceId] });
}
```
- Automatically refetches latest configuration after save
- Ensures UI stays in sync with server state

#### On Reset Operation
```typescript
resetMutation.onSuccess: (data) => {
  // Directly updates cache with new data
  queryClient.setQueryData(['model-config', workspaceId], data.model_config);
}
```
- Optimistically updates cache with reset data
- No additional fetch required

### 3. **Loading States**
- Combined loading states from both queries
- Shows loading spinner only when actually fetching data
- Subsequent visits show data instantly from cache

### 4. **Error Handling**
- Proper error handling with toast notifications
- Errors don't break the UI
- Failed requests can be retried

## Benefits

### Performance Improvements
1. **Reduced API Calls**: 
   - Page refreshes use cached data (no server call)
   - Navigation away and back uses cached data
   - Only fetches when cache is stale or invalidated

2. **Faster Load Times**:
   - Instant display of cached data
   - Background refetching for stale data
   - Smoother user experience

3. **Reduced Server Load**:
   - Fewer requests to server
   - Better scalability
   - Lower bandwidth usage

### User Experience
1. **Instant Feedback**: Cached data shows immediately
2. **Optimistic Updates**: Changes reflected instantly
3. **Automatic Sync**: Fresh data fetched in background
4. **No Flickering**: Smooth transitions between cached and fresh data

## Cache Behavior Examples

### Scenario 1: Initial Visit
```
User visits page → Shows loading → Fetches data → Displays data → Caches for 5 min
```

### Scenario 2: Page Refresh Within 5 Minutes
```
User refreshes → Instantly shows cached data → No API call
```

### Scenario 3: Page Refresh After 5 Minutes
```
User refreshes → Shows cached data → Fetches fresh data in background → Updates when ready
```

### Scenario 4: Save Configuration
```
User saves → API call → Success → Invalidates cache → Fetches fresh data → Updates display
```

### Scenario 5: Reset Configuration
```
User resets → API call → Success → Updates cache directly → No refetch needed
```

### Scenario 6: Navigate Away and Return
```
User navigates away → Returns within 10 min → Cached data still available → Instant display
User navigates away → Returns after 10 min → Cache cleared → Fresh fetch required
```

## Technical Implementation

### Key Dependencies
- `@tanstack/react-query` - Provides caching and state management
- React Query DevTools (optional) - For debugging cache state

### Cache Configuration
```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes (how long data is considered fresh)
gcTime: 10 * 60 * 1000,     // 10 minutes (how long unused data stays in memory)
```

### Query Keys
- Global models: `['available-models']`
- Workspace config: `['model-config', workspaceId]`

## Maintenance

### Adjusting Cache Times
To modify cache duration, update the `staleTime` and `gcTime` values:

```typescript
staleTime: 10 * 60 * 1000,  // Increase to 10 minutes for longer cache
gcTime: 20 * 60 * 1000,     // Increase proportionally
```

### Debugging Cache
Use React Query DevTools to inspect:
- Current cache state
- Query status
- Fetch times
- Cache invalidation events

### Force Refetch
To force a fresh fetch regardless of cache:
```typescript
queryClient.invalidateQueries({ queryKey: ['available-models'] });
queryClient.invalidateQueries({ queryKey: ['model-config', workspaceId] });
```

## Best Practices Applied

1. ✅ **Type Safety**: All queries properly typed with TypeScript
2. ✅ **Error Handling**: Comprehensive error handling with user feedback
3. ✅ **Loading States**: Proper loading indicators
4. ✅ **Cache Invalidation**: Smart invalidation on mutations
5. ✅ **Optimistic Updates**: Direct cache updates where appropriate
6. ✅ **Stale-While-Revalidate**: Shows cached data while fetching fresh data
7. ✅ **Memory Management**: Automatic garbage collection of unused data

## Future Enhancements

### Potential Improvements
1. **Prefetching**: Prefetch model data on app initialization
2. **Optimistic UI**: Show immediate UI updates before server confirmation
3. **Persistent Cache**: Use localStorage for cross-session caching
4. **Retry Logic**: Automatic retry on failed requests
5. **Cache Warming**: Pre-populate cache on login

### Monitoring
Consider adding:
- Cache hit/miss metrics
- Performance monitoring
- Error rate tracking
- API call reduction analytics
