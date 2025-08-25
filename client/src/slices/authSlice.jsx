import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  token: localStorage.getItem("token")
    ? JSON.parse(localStorage.getItem("token"))
    : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setToken(state, value) {
      state.token = value.payload;
    },
    clearToken(state) {
      state.token = null;
      localStorage.removeItem("token"); // ✅ logout case
    },
  },
});

export const { setLoading, setToken, clearToken } = authSlice.actions;

export default authSlice.reducer;
