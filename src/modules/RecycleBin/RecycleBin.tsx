import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LoaderCircle,
  RefreshCw,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import CustomPagination from '@/components/common/custom-pagination';
import { get, post, del } from '@/services/apiService';
import { formatCurrency } from '@/lib/formatter';

// Types
interface DeletedLoan {
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  balanceInterest: number;
  deletedAt: string;
  party: {
    id: number;
    partyName: string;
    mobile1: string;
    address: string;
  };
}

interface DeletedLoansResponse {
  loans: DeletedLoan[];
  page: number;
  totalPages: number;
  totalLoans: number;
}

const RecycleBin = () => {
  const [loansPage, setLoansPage] = useState(1);
  const limit = 10;
  
  const queryClient = useQueryClient();

  // Fetch deleted loans
  const {
    data: loansData,
    isLoading: isLoadingLoans,
    isError: isErrorLoans,
    error: loansError,
  } = useQuery<DeletedLoansResponse>({
    queryKey: ['recycle-bin-loans', loansPage, limit],
    queryFn: () => get('/recycle-bin/loans', { page: loansPage, limit }),
    keepPreviousData: true,
  });

  // Restore loan mutation
  const restoreLoanMutation = useMutation({
    mutationFn: (id: number) => post(`/recycle-bin/loans/${id}/restore`, {}),
    onSuccess: (data: any) => {
      const entriesCount = data.restoredEntriesCount || 0;
      const message = entriesCount > 0 
        ? `Loan and ${entriesCount} related entries restored successfully`
        : 'Loan restored successfully';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore loan');
    },
  });

  // Permanently delete loan mutation
  const permanentlyDeleteLoanMutation = useMutation({
    mutationFn: (id: number) => del(`/recycle-bin/loans/${id}`),
    onSuccess: (data: any) => {
      const entriesCount = data.deletedEntriesCount || 0;
      const message = entriesCount > 0 
        ? `Loan and ${entriesCount} related entries permanently deleted`
        : 'Loan permanently deleted';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to permanently delete loan');
    },
  });

  // Empty recycle bin mutation
  const emptyRecycleBinMutation = useMutation({
    mutationFn: () => del('/recycle-bin/empty?type=loans'),
    onSuccess: (data: any) => {
      const loansCount = data.deletedLoansCount || 0;
      const entriesCount = data.deletedEntriesCount || 0;
      let message = 'Recycle bin emptied successfully';
      
      if (loansCount > 0 && entriesCount > 0) {
        message = `${loansCount} loans and ${entriesCount} related entries permanently deleted`;
      } else if (loansCount > 0) {
        message = `${loansCount} loans permanently deleted`;
      }
      
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to empty recycle bin');
    },
  });


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recycle Bin</h1>
          <p className="text-muted-foreground">
            Manage deleted loans. Items can be restored or permanently deleted.
          </p>
        </div>
        <div className="flex gap-2">
          {loansData?.totalLoans > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Empty All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Permanently Delete All Loans?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all loans in the recycle bin.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => emptyRecycleBinMutation.mutate()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {emptyRecycleBinMutation.isLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Permanently Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Loans content */}
      <Card>
        <CardHeader>
          <CardTitle>Deleted Loans ({loansData?.totalLoans || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLoans ? (
            <div className="flex items-center justify-center p-4">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : isErrorLoans ? (
            <div className="text-center text-destructive py-4">
              {(loansError as any)?.message || 'Failed to load deleted loans'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deleted Date</TableHead>
                    <TableHead>Loan Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loansData?.loans.length ? (
                    loansData.loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          {new Date(loan.deletedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(loan.loanDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{loan.party.partyName}</span>
                            <span className="text-sm text-muted-foreground">
                              {loan.party.mobile1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell>{loan.interest}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => restoreLoanMutation.mutate(loan.id)}
                              disabled={restoreLoanMutation.isLoading}
                              title="Restore Loan"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Permanently Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Permanently Delete Loan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the loan for{' '}
                                    <strong>{loan.party.partyName}</strong>.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => permanentlyDeleteLoanMutation.mutate(loan.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Permanently Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No deleted loans found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {loansData && loansData.totalPages > 1 && (
                <div className="mt-4">
                  <CustomPagination
                    page={loansPage}
                    totalPages={loansData.totalPages}
                    onPageChange={setLoansPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecycleBin;
