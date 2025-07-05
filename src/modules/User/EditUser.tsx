import React from "react";
import UserForm from "./UserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EditUser = ({ isOpen, onClose, userId }: EditUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <UserForm
          mode="edit"
          userId={userId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditUser;
