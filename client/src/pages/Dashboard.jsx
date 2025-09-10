// Dashboard.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 p-6 lg:p-10 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
