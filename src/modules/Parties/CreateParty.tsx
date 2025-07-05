
import PartyForm from "./PartyForm";

interface CreatePartyProps {
  onSuccess?: () => void;
  className?: string;
}

const CreateParty = ({ onSuccess, className }: CreatePartyProps) => {
  return (
    <PartyForm 
      mode="create" 
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default CreateParty;
