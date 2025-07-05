import React from "react";
import UserForm from "./UserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateUser = ({ isOpen, onClose }: CreateUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <UserForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUser;
