import { LOG_OUT } from 'actions/types';
import authReducer from './authReducer';
import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import nemReducer from './nemReducer';
import playerReducer from './playerReducer';
import releaseReducer from './releaseReducer';
import salesReducer from './salesReducer';
import toastReducer from './toastReducer';

const appReducer = combineReducers({
  form: formReducer,
  nem: nemReducer,
  player: playerReducer,
  releases: releaseReducer,
  salesData: salesReducer,
  toastList: toastReducer,
  user: authReducer
});

const rootReducer = (state, action) => {
  if (action.type === LOG_OUT) {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
