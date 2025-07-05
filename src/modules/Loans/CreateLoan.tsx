
import LoanForm from "./LoanForm";

interface CreateLoanProps {
  onSuccess?: () => void;
  className?: string;
}

const CreateLoan = ({ onSuccess, className }: CreateLoanProps) => {
  return (
    <LoanForm 
      mode="create" 
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default CreateLoan;
