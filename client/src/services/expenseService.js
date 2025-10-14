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

// expenseService.js
export async function getExpenses(filters = {}, token) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    
    const response = await apiConnector(
      "GET",
      `${BASE_URL}/expense?${queryParams}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data; // ✅ Returns the data!
    
  } catch (error) {
    console.error("ERROR FETCHING EXPENSES", error);
    throw error; // Re-throw so component can catch it
  }
}


// expenseService.js
export async function getExpenseTotals(token) {
  try {    
    const response = await apiConnector(
      "GET",
      `${BASE_URL}/expense/totals`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data; // ✅ Returns the data!
    
  } catch (error) {
    console.error("ERROR FETCHING TOTALS", error);
    throw error; // Re-throw so component can catch it
  }
}

