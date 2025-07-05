
import LoanForm from "./LoanForm";

interface EditLoanProps {
  loanId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditLoan = ({ loanId, onSuccess, className }: EditLoanProps) => {
  return (
    <LoanForm 
      mode="edit" 
      loanId={loanId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditLoan;
