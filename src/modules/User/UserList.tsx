import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";
import { Button, Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, {
  Option,
} from "@/components/common/multiple-selector"; // Import MultipleSelector from common folder
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, patch } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Filter,
  Download,
  ShieldEllipsis,
  Search,
  PlusCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import ChangePasswordDialog from "./ChangePasswordDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import CreateUser from "./CreateUser"; // Import CreateUser component
import EditUser from "./EditUser"; // Add this import

// Function to format role name
const formatRoleName = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const fetchUsers = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  active: string,
  roles: string[],
  recordsPerPage: number
) => {
  const rolesQuery = roles.length > 0 ? `&roles=${roles.join(",")}` : "";
  const response = await get(
    `/users?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&active=${active}${rolesQuery}&limit=${recordsPerPage}`
  );
  return response;
};

const UserList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("name"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [active, setActive] = useState("all"); // Active filter (all, true, false)
  const [roles, setRoles] = useState<string[]>([]); // Selected roles for filtering
  const [availableRoles, setAvailableRoles] = useState<Option[]>([]); // Roles fetched from API
  const [showFilters, setShowFilters] = useState(false); // State to show/hide filters
  const [showChangePassword, setShowChangePassword] = useState(false); // State to toggle ChangePassword dialog
  const [selectedUser, setSelectedUser] = useState<number | null>(null); // Track the selected user for password change
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [userToDelete, setUserToDelete] = useState<number | null>(null); // Track the user ID to delete
  const [showCreateDialog, setShowCreateDialog] = useState(false); // Add state for create user dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // const rolesData = await get("/roles");
        // const formattedRoles: Option[] = Object.entries(rolesData.roles).map(
        //   ([key, value]) => ({
        //     label: formatRoleName(value),
        //     value: value,
        //   })
        // );
        // setAvailableRoles(formattedRoles);
      } catch (error: any) {
        toast.error("Failed to fetch roles");
      }
    };

    fetchRoles();
  }, []);

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "users",
      currentPage,
      sortBy,
      sortOrder,
      search,
      active,
      roles,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchUsers(
        currentPage,
        sortBy,
        sortOrder,
        search,
        active,
        roles,
        recordsPerPage
      ),
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.totalUsers || 0;

  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => del(`/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries(["users"]);
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const confirmDelete = (id: number) => {
    setUserToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
      setShowConfirmation(false);
      setUserToDelete(null);
    }
  };

  // Mutation for changing user status
  const changeStatusMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      patch(`/users/${userId}/status`, { active }),
    onSuccess: () => {
      toast.success("User status updated successfully");
      queryClient.invalidateQueries(["users"]);
    },
    onError: () => {
      toast.error("Failed to update user status");
    },
  });

  const handleChangeStatus = (userId: string, currentStatus: boolean) => {
    changeStatusMutation.mutate({ userId, active: !currentStatus });
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending order
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle active filter change
  const handleActiveChange = (value: string) => {
    setActive(value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle role filter change
  const handleRoleChange = (selectedRoles: Option[]) => {
    setRoles(selectedRoles.map((role) => role.value)); // Extract values from selected options
    setCurrentPage(1); // Reset to the first page
  };

  // Function to export user data
  const handleExport = async () => {
    try {
      // Safely encode query parameters
      const rolesQuery =
        roles.length > 0 ? `roles=${encodeURIComponent(roles.join(","))}` : "";
      const queryParams = [
        `sortBy=${encodeURIComponent(sortBy)}`,
        `sortOrder=${encodeURIComponent(sortOrder)}`,
        `search=${encodeURIComponent(search)}`,
        `active=${encodeURIComponent(active)}`,
        rolesQuery,
        `export=true`, // Ensure export=true is at the end
      ]
        .filter(Boolean) // Remove empty parameters
        .join("&"); // Join parameters with '&'

      const exportUrl = `/users?${queryParams}`;

      // Fetch the Excel file using the updated get() function
      const response = await get(exportUrl, null, { responseType: "blob" });

      // Trigger file download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "users.xlsx"); // Save the file with a .xlsx extension
      toast.success("User data exported successfully");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export user data");
    }
  };

  const handleOpenChangePassword = (userId: number) => {
    setSelectedUser(userId); // Set the selected user
    setShowChangePassword(true); // Show the ChangePassword dialog
  };

  const handleCloseChangePassword = () => {
    setSelectedUser(null); // Clear the selected user
    setShowChangePassword(false); // Hide the ChangePassword dialog
  };

  const handleEdit = (userId: string) => {
    setSelectedUserId(userId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedUserId(null);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        User Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={
                  showFilters || roles.length > 0 || active !== "all"
                    ? "default"
                    : "outline"
                }
                className={`
                  ${
                    showFilters || roles.length > 0 || active !== "all"
                      ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                      : "hover:bg-accent"
                  }
                  transition-all duration-200
                `}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter
                  className={`mr-2 h-4 w-4 ${showFilters ? "text-white" : ""}`}
                />
                Filters
                {(roles.length > 0 || active !== "all") && (
                  <span className="ml-2 bg-white text-primary font-medium rounded-full px-2 py-0.5 text-xs">
                    {roles.length + (active !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isLoading || users.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
              </Button>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Status
                  </label>
                  <Select value={active} onValueChange={handleActiveChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="true">Active Users</SelectItem>
                      <SelectItem value="false">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Roles Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Roles
                  </label>
                  {availableRoles.length > 0 ? (
                    <MultipleSelector
                      defaultOptions={availableRoles}
                      selectedOptions={roles.map((role) => ({
                        label: formatRoleName(role),
                        value: role,
                      }))}
                      onChange={handleRoleChange}
                      placeholder="Select roles"
                    />
                  ) : (
                    <div className="h-10 flex items-center text-gray-500">
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Loading roles...
                    </div>
                  )}
                </div>
                {/* Clear Filters Button */}
                <div className="flex justify-end mt-7">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setActive("all");
                      setRoles([]);
                      setCurrentPage(1); // Reset to first page when clearing filters
                      setShowFilters(false); // Optionally hide the filters panel after clearing
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load users.
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {sortBy === "name" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("email")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Email</span>
                        {sortBy === "email" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("role")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Role</span>
                        {sortBy === "role" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("lastLogin")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Last Login</span>
                        {sortBy === "lastLogin" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("active")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Active</span>
                        {sortBy === "active" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role
                            .split(" ")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {user.lastLogin
                          ? formatDateTime(user.lastLogin)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user.id.toString())}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(user.id, user.active)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    {user.active ? (
                                      <XCircle className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span>
                                      Set {user.active ? "Inactive" : "Active"}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleOpenChangePassword(user.id)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <ShieldEllipsis className="h-4 w-4" />
                                    <span>Change Password</span>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalUsers}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No users found.</div>
          )}
        </CardContent>
      </Card>

      {/* Render ChangePasswordDialog */}
      {selectedUser && (
        <ChangePasswordDialog
          userId={selectedUser}
          isOpen={showChangePassword}
          onClose={handleCloseChangePassword}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Add CreateUser dialog */}
      <CreateUser
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Add EditUser dialog */}
      {selectedUserId && (
        <EditUser
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          userId={selectedUserId}
        />
      )}
    </div>
  );
};

export default UserList;
