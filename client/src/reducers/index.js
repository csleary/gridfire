import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import authReducer from './authReducer';
import nemReducer from './nemReducer';
import playerReducer from './playerReducer';
import releaseReducer from './releaseReducer';
import salesReducer from './salesReducer';
import toastReducer from './toastReducer';
import txReducer from './txReducer';

export default combineReducers({
  form: formReducer,
  nem: nemReducer,
  player: playerReducer,
  releases: releaseReducer,
  salesData: salesReducer,
  toast: toastReducer,
  transactions: txReducer,
  user: authReducer
});
