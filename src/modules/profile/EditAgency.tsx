import React from "react";
import UserForm from "./profile";

const EditUser = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <UserForm mode="edit" />
    </div>
  );
};

export default EditUser;
