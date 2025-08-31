import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import OpenRoute from "./guards/OpenRoute";
import PrivateRoute from "./guards/PrivateRoute";
import AddExpense from "./pages/AddExpense";
import ProfileSetup from "./components/ProfileSetup";
import PreferencesSetup from "./components/PreferencesSetup";
import ProfileDetails from "./pages/ProfileDetails";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="w-screen min-h-screen overflow-hidden">
      <Routes>
        <Route
          path="/"
          element={
            <OpenRoute>
              <Home />
            </OpenRoute>
          }
        />

        <Route
          path="/add-expense"
          element={
            <PrivateRoute>
              <AddExpense />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile-setup"
          element={
            <PrivateRoute>
              <ProfileSetup />
            </PrivateRoute>
          }
        />

        <Route
          path="/preferences"
          element={
            <PrivateRoute>
              <PreferencesSetup />
            </PrivateRoute>
          }
        />

          <Route
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
            <Route path="dashboard/my-profile" element={<ProfileDetails />} />

        </Route>
      </Routes>
    </div>
  );
}

export default App;
