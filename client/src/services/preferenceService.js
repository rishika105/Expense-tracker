import { apiConnector } from "../utils/apiConnector";
import { setIsVerified, setLoading } from "../slices/authSlice";
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
      // console.log("PREFERENCES RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      dispatch(setIsVerified(response.data.verified));
      localStorage.setItem("isVerified", response.data.verified);

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
      // console.log("PREFERENCES RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Preference update successfully!");
    } catch (error) {
      console.log("ERROR UPDATING PREFERENCES.....", error);
      toast.error("Could not update preference details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

// Fixed: Now returns the response
export const fetchUserPreferences = async (token) => {
  const toastId = toast.loading("Loading...");
  try {
    const response = await apiConnector("GET", `${BASE_URL}`, null, {
      Authorization: `Bearer ${token}`,
    });
    // console.log("PREFERENCES RESPONSE : ", response);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.preferences; // Return the data
  } catch (error) {
    console.log("ERROR FETCHING PREFERENCES.....", error);
    toast.error("Could not get preference details");
    return null; // Return null on error
  } finally {
    toast.dismiss(toastId);
  }
};