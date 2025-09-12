import toast from "react-hot-toast";
import { setLoading } from "../slices/authSlice";
import { apiConnector } from "../utils/apiConnector";

const BASE_URL = import.meta.env.VITE_API_URL;

export function addExpense(data, token) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const toastId = toast.loading("Loading...");
    try {
      const response = await apiConnector(
        "POST",
        `${BASE_URL}/expense/add`,
        data,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      console.log("EXPENSE RESPONSE : ", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Transaction added!");
    } catch (error) {
      console.log("ERROR ADDING EXPENSE.....", error);
      toast.error("Could not add transaction");
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}
