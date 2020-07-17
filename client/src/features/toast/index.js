import { createSlice, nanoid } from '@reduxjs/toolkit';
const MAX = 9;

const toastSlice = createSlice({
  name: 'toast',
  initialState: {
    messages: []
  },
  reducers: {
    addToastError(state, action) {
      const { key, message } = action.payload;
      state.messages = [...state.messages.slice(-MAX), { key, message, type: 'error', visible: true }];
    },

    addToastInfo(state, action) {
      state.messages = [...state.messages.slice(-MAX), { ...action.payload, type: 'info', visible: true }];
    },

    addToastSuccess(state, action) {
      state.messages = [...state.messages.slice(-MAX), { ...action.payload, type: 'success', visible: true }];
    },

    addToastWarning(state, action) {
      state.messages = [...state.messages.slice(-MAX), { ...action.payload, type: 'warning', visible: true }];
    },

    hideToast(state, action) {
      state.messages = state.messages.map(toast => {
        if (toast.key === action.payload) return { ...toast, visible: false };
        return toast;
      });
    }
  }
});

const toastError = message => dispatch => {
  const key = nanoid();
  dispatch(addToastError({ key, message }));
  setTimeout(dispatch, 10000, hideToast(key));
};

const toastInfo = message => dispatch => {
  const key = nanoid();
  dispatch(addToastInfo({ key, message }));
  setTimeout(() => dispatch(hideToast(key)), 5000);
};

const toastSuccess = message => dispatch => {
  const key = nanoid();
  dispatch(addToastSuccess({ key, message }));
  setTimeout(() => dispatch(hideToast(key)), 5000);
};

const toastWarning = message => dispatch => {
  const key = nanoid();
  dispatch(addToastWarning({ key, message }));
  setTimeout(() => dispatch(hideToast(key)), 5000);
};

export const { addToastError, addToastInfo, addToastSuccess, addToastWarning, hideToast } = toastSlice.actions;
export { toastInfo, toastError, toastSuccess, toastWarning };
export default toastSlice.reducer;
