import React from "react";

const ConfirmationModal = ({ modalData }) => {
  return (
    <div className="fixed backdrop-blur-sm inset-0 overflow-hidden h-full">
      <div className="bg-slate-200 w-[30%] h-[30%] flex flex-col justify-center items-center mt-10">
        <h1>{modalData.text1}</h1>
        <button
          onClick={modalData.btn1Handler}
          className="p-4 bg-slate-700 text-white"
        >
          {modalData.btn1Text}
        </button>
        <button onclick={modalData.btn2Handler}>{modalData.btn2Text}</button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
