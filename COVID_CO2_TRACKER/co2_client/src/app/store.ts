import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';


import {rootReducer} from './rootReducer';

export const store = configureStore({
  reducer: rootReducer
});

// IF I WANTED HOT MODULE RELOADING:
// if (process.env.NODE_ENV === 'development' && module.hot) {
//   module.hot.accept('./rootReducer', () => {
//     const newRootReducer = require('./rootReducer').default
//     store.replaceReducer(newRootReducer)
//   })
// }
// But I don't like it, for the same reason I don't use edit and continue in C++.


export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppDispatch = typeof store.dispatch
