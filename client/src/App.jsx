import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import OpenRoute from "./guards/OpenRoute";
import PrivateRoute from "./guards/PrivateRoute";
import Expense from "./pages/Expense";

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
          path="/expense"
          element={
            <PrivateRoute>
              <Expense />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
