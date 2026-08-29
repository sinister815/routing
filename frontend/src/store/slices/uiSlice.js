import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isLogoutModalOpen: false,
    toast: null,
  },
  reducers: {
    openLogoutModal: (state) => {
      state.isLogoutModalOpen = true;
    },
    closeLogoutModal: (state) => {
      state.isLogoutModalOpen = false;
    },
    showToast: (state, action) => {
      state.toast = action.payload; // { type: 'success'|'error'|'info', message: string }
    },
    clearToast: (state) => {
      state.toast = null;
    },
  },
});

export const { openLogoutModal, closeLogoutModal, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
