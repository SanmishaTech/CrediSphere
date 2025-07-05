import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomPagination from "@/components/common/custom-pagination";
import { get } from "@/services/apiService";
import { formatCurrency } from "@/lib/formatter";

// Interfaces
interface Party {
  id: number;
  partyName: string;
  mobile1: string;
  reference: string;
}

interface Entry {
  id: number;
  loanId: number;
  entryDate: string;
  balanceAmount: number;
  interestAmount: number;
  receivedDate?: string | null;
  receivedAmount?: number | null;
  receivedInterest?: number | null;
  loan?: {
    id: number;
    partyId: number;
    loanAmount: number;
    party?: {
      partyName: string;
    };
  };
}

interface DashboardData {
  entries: Entry[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

const Dashboard = () => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 5; // Fixed pagination limit as requested

  // Fetch parties for dropdown
  const {
    data: partiesData,
    isLoading: isLoadingParties,
  } = useQuery({
    queryKey: ["parties"],
    queryFn: () => get("/parties", { page: 1, limit: 100 }), // Get all parties for dropdown
  });

  // Fetch entries based on selected party
  const {
    data: entriesData,
    isLoading: isLoadingEntries,
    isError,
    error,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard-entries", selectedPartyId, page, limit],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit,
        sortBy: "entryDate",
        sortOrder: "desc",
      };
      
      if (selectedPartyId) {
        // First get loans for the selected party
        const loansResponse = await get("/loans", { partyId: selectedPartyId });
        const loanIds = loansResponse.loans?.map((loan: any) => loan.id) || [];
        
        if (loanIds.length === 0) {
          return {
            entries: [],
            totalEntries: 0,
            totalPages: 0,
            currentPage: page,
          };
        }
        
        // Get entries for these loans
        const entriesResponse = await get("/entries", {
          ...params,
          loanIds: loanIds.join(',')
        });
        
        return {
          entries: entriesResponse.entries || [],
          totalEntries: entriesResponse.totalEntries || 0,
          totalPages: entriesResponse.totalPages || 0,
          currentPage: page,
        };
      }
      
      // If no party selected, return empty
      return {
        entries: [],
        totalEntries: 0,
        totalPages: 0,
        currentPage: page,
      };
    },
    enabled: true, // Always enabled, will return empty when no party selected
  });

  const handlePartyChange = (partyId: string) => {
    setSelectedPartyId(partyId);
    setPage(1); // Reset to first page when party changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Dashboard</h2>
        <p>{(error as any)?.message || "Failed to load dashboard data"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Select a party to view their loan entries
        </p>
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Loan Entries 
            {selectedPartyId && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Showing entries for: <span className="font-medium">
                    {partiesData?.parties?.find((p: Party) => p.id.toString() === selectedPartyId)?.partyName || 'Selected Party'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Total entries: <span className="font-medium">
                    {entriesData?.totalEntries || 0}
                  </span>
                  {entriesData?.totalEntries && entriesData.totalEntries > limit && (
                    <span> (showing {limit} per page)</span>
                  )}
                </p>
              </div>
            )}
            </CardTitle>
          
            <div className="flex flex-col gap-2">
               <Select value={selectedPartyId} onValueChange={handlePartyChange}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="Choose a party to view entries" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingParties ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading parties...
                    </div>
                  ) : partiesData?.parties?.length > 0 ? (
                    partiesData.parties.map((party: Party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.partyName} - {party.mobile1}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No parties found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
         
        </CardHeader>
        <CardContent>
          {!selectedPartyId ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Please select a party to view their loan entries</p>
            </div>
          ) : isLoadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
              <span>Loading entries...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Balance Amount</TableHead>
                      <TableHead>Interest Amount</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Received Amount</TableHead>
                      <TableHead>Received Interest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesData?.entries?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No entries found for this party.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entriesData?.entries?.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {new Date(entry.entryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{entry.loanId}</TableCell>
                          <TableCell>{formatCurrency(entry.balanceAmount)}</TableCell>
                          <TableCell>{formatCurrency(entry.interestAmount)}</TableCell>
                          <TableCell>
                            {entry.receivedDate 
                              ? new Date(entry.receivedDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {entry.receivedAmount 
                              ? formatCurrency(entry.receivedAmount)
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {entry.receivedInterest 
                              ? formatCurrency(entry.receivedInterest)
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {entriesData && entriesData.totalPages > 1 && (
                <div className="flex justify-end items-center mt-4">
                  <CustomPagination
                    currentPage={page}
                    totalPages={entriesData.totalPages}
                    onPageChange={handlePageChange}
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

export default Dashboard;
