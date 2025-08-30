import { apiConnector } from "../utils/apiConnector";
import { setLoading } from "../slices/authSlice";
import toast from "react-hot-toast";

const BASE_URL = `${import.meta.env.VITE_API_URL}/preference`;

export function addPreference(data, token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("POST", `${BASE_URL}/create`, data, {
        Authorization: `Bearer ${token}`,
      });
      console.log("PREFERENCES RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Adding preference completed!");
    } catch (error) {
      console.log("ERROR UPDATING PREFERENCES.....", error);
      toast.error("Could not add preference details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

export function updatePreference(data, token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("PUT", `${BASE_URL}/update`, data, {
        Authorization: `Bearer ${token}`,
      });
      console.log("PREFERENCES RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Preference update successfully!");
    } catch (error) {
      console.log("ERROR UPDATING PREFERENCES.....", error);
      toast.error("Could not add profile details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

export function fetchUserPreferences(token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("GET", `${BASE_URL}`, {
        Authorization: `Bearer ${token}`,
      });
      console.log("PREFERENCES RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // toast.success("Preferences details completed!");
    } catch (error) {
      console.log("ERROR FETCHING PREFERENCES.....", error);
      toast.error("Could not get preference details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}
