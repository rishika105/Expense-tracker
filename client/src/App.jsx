import { Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./Home";

function App() {
  return (
    <div className="w-screen min-h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;
