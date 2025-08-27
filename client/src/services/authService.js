import { apiConnector } from "../utils/apiConnector";
import { setLoading, setToken } from "../slices/authSlice";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;

export function sendOtp(email) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("POST", `${BASE_URL}/send-otp`, {
        email,
      });
      console.log("SEND OTP RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("OTP sent success");
    } catch (error) {
      console.log("SEND OTP API ERROR.....", error);
      toast.error("Could not send OTP");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

export function verifyEmail(email, otp, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector("POST", `${BASE_URL}/verify-email`, {
        email,
        otp,
      });
      console.log("VERIFY EMAIL RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      dispatch(setToken(response.data.token));
      if(!response.data.verified){
        navigate("/profile-setup");
      }
      else navigate("/dashboard")
      
      localStorage.setItem("token", JSON.stringify(response.data.token)); //for persistence after log out or reload or when app reruns...the redus goes empty

      toast.success("Log In success");
    } catch (error) {
      console.log("SEND VERIFY EMAIL ERROR.....", error);
      toast.error("Could not verify email");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}

export function updateProfile(data, token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
    const response = await apiConnector("PUT", `${BASE_URL}/update-profile`, data,      {
      Authorization: `Bearer ${token}`,
    });
      console.log("PROFILE RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Profile details completed!");
    } catch (error) {
      console.log("ERROR UPDATING PROFILE.....", error);
      toast.error("Could not add profile details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}


export function fetchProfileDetails(token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
    const response = await apiConnector("GET", `${BASE_URL}/get-user-details`,     {
      Authorization: `Bearer ${token}`,
    });
      console.log("PROFILE RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // toast.success("Profile details completed!");
    } catch (error) {
      console.log("ERROR FETCHING PROFILE.....", error);
      toast.error("Could not get profile details");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}


export function deleteUser(token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
    const response = await apiConnector("DELETE", `${BASE_URL}/delete-user`,  {
      Authorization: `Bearer ${token}`,
    });
      console.log("DELETE USER RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("User deleted Successfully!");
    } catch (error) {
      console.log("ERROR DELETING USER.....", error);
      toast.error("Could not delete user");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}
