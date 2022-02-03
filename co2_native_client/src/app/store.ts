// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { configureStore, Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk'
import { rootReducer, RootState } from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export type AppThunk = ThunkAction<void, RootState, null, Action<string>>;
