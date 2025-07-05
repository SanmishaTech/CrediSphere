import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LoaderCircle,
  PenSquare,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  PlusCircle
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import CustomPagination from "@/components/common/custom-pagination";
import { get, del } from "@/services/apiService";
// Import components from current directory
import CreateParty from "./CreateParty";
import EditParty from "./EditParty";

const PartyList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("partyName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editPartyId, setEditPartyId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch parties
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["parties", page, limit, search, sortBy, sortOrder],
    queryFn: () => get("/parties", { page, limit, search, sortBy, sortOrder }),
  });

  // Delete party mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/parties/${id}`),
    onSuccess: () => {
      toast.success("Party deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to delete party");
    },
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sort changes
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data || newPage <= data.totalPages)) {
      setPage(newPage);
    }
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  // Handle edit party
  const handleEdit = (id: string) => {
    setEditPartyId(id);
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditPartyId(null);
  };

  // Handle error party
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Parties</h2>
        <p>{(error as any)?.message || "Failed to load parties"}</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["parties"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      
      
      
      <Card className="border border-border">
        <CardHeader className="text-xl font-bold">
          Parties
          <CardDescription>
          Manage parties
        </CardDescription>
        </CardHeader>
      
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 mb-4 ">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parties..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8 w-full"
              />
            </div>

            {/* Action Buttons */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

 
          {/* Parties Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Account Number</TableHead>

                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("partyName")}>
                    Party Name
                    {sortBy === "partyName" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Mobile1</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading parties...</p>
                    </TableCell>
                  </TableRow>
                ) : data?.parties?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No parties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.parties?.map((party: any) => (
                    <TableRow key={party.id}>
                      <TableCell>{party.accountNumber}</TableCell>
                      <TableCell>{party.partyName}</TableCell>
                      <TableCell>{party.mobile1}</TableCell>
                      <TableCell>{party.reference}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(party.id.toString())}
                          >
                            <PenSquare className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this party? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(party.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteMutation.isPending ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Show</span>
                <select
                  className="border rounded p-1 text-sm"
                  value={limit}
                  onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm">per page</span>
              </div>
              
              <CustomPagination
                currentPage={page}
                totalPages={data.totalPages}
                totalRecords={data.totalParties}
                recordsPerPage={limit}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
              />
              
              <div className="text-sm">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.totalParties)} of {data.totalParties}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Party Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
          </DialogHeader>
          <CreateParty onSuccess={handleCreateDialogClose} />
        </DialogContent>
      </Dialog>

      {/* Edit Party Dialog */}
      {editPartyId && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Party</DialogTitle>
            </DialogHeader>
            <EditParty partyId={editPartyId} onSuccess={handleEditDialogClose} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PartyList;
