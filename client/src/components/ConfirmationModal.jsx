import React from "react";

const ConfirmationModal = ({ modalData }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {modalData.text1}
        </h3>
        <p className="text-slate-600 mb-6">{modalData.text2}</p>
        <div className="flex space-x-3">
          <button
            onClick={modalData.btn1Handler}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            {modalData.btn1Text}
          </button>
          <button
            onClick={modalData.btn2Handler}
            className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
            F
          >
            {modalData.btn2Text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
