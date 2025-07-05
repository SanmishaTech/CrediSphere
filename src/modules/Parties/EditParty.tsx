
import PartyForm from "./PartyForm";

interface EditPartyProps {
  partyId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditParty = ({ partyId, onSuccess, className }: EditPartyProps) => {
  return (
    <PartyForm 
      mode="edit" 
      partyId={partyId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditParty;
