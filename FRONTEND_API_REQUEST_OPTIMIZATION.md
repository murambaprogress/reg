# Frontend API Request Optimization Fix

## Issues Identified

### Critical Issues (Causing Instability)

1. **TechnicianSyncContext.jsx**
   - **Problem**: Every action (updateJobStatus, requestParts, sendMessage, etc.) calls `syncData()` which makes 3 parallel API requests
   - **Impact**: A single status update triggers 3 additional fetches, causing request storms
   - **Fix**: Remove automatic `syncData()` calls after actions, let components manually refresh when needed

2. **Event Handler Cascades**
   - **Problem**: Event listener for 'admin-message-sent' triggers `fetchJobs()` AND `fetchMessages()`  
   - **Impact**: Double fetching on every message event
   - **Fix**: Remove redundant fetches from event handlers

3. **Dashboard Clock**
   - **Problem**: `setInterval` every 1 second for clock display
   - **Impact**: Constant React re-renders
   - **Fix**: Reduce to every 30 seconds or use CSS animation

4. **Filter Changes Without Debouncing**
   - **Problem**: Reports analytics fetches on every filter change
   - **Impact**: Multiple simultaneous requests
   - **Fix**: Add 500ms debounce on filter changes

### Moderate Issues

5. **Missing Request Caching**
   - Multiple components fetch same data independently
   - No request deduplication

6. **Optimistic Updates**
   - Some actions do full refetch instead of local state updates
   - Unnecessary round trips

## Implementation Plan

### Phase 1: Remove Cascading Syncs (Critical)
- [ ] Remove `syncData()` calls from action methods in TechnicianSyncContext
- [ ] Add manual refresh button where needed
- [ ] Remove redundant event handler fetches

### Phase 2: Add Debouncing
- [ ] Debounce filter changes in reports
- [ ] Debounce search inputs
- [ ] Throttle clock updates

### Phase 3: Optimize State Management  
- [ ] Add request deduplication utility
- [ ] Implement proper caching strategy
- [ ] Use optimistic updates consistently

## Files to Modify

1. `src/pages/technician-workstation/TechnicianSyncContext.jsx` - Remove cascading syncs
2. `src/pages/dashboard-overview/index.jsx` - Fix clock interval
3. `src/pages/reports-analytics/index.jsx` - Add filter debouncing
4. `src/pages/dashboard-overview/components/JobStatusBoard.jsx` - Remove redundant fetches
5. Create `src/utils/requestCache.js` - Add request deduplication utility

## Expected Impact

- **Before**: 10-20 requests per second during active use
- **After**: 2-5 requests per second during active use
- **Improvement**: 75-80% reduction in API calls
