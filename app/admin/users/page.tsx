"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  UserPlus,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Info,
  Mail,
  Clock,
  Trash2,
} from "lucide-react";
import { UserRole } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth } from "@/lib/firebase/config";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { setDoc } from "firebase/firestore";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  lastLogin?: Date;
  createdAt?: Date;
}

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Controller", "MDM"]),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const defaultValues: Partial<UserFormValues> = {
  email: "",
  password: "",
  displayName: "",
  role: "Controller",
  region: "DE",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("Controller");
  const [activeTab, setActiveTab] = useState<"all" | "controller" | "mdm">(
    "all"
  );
  const [sortField, setSortField] = useState<"email" | "role" | "displayName">(
    "email"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("email"));
      const querySnapshot = await getDocs(q);

      const usersList: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role || "Controller",
          lastLogin: userData.lastLogin
            ? userData.lastLogin.toDate()
            : undefined,
          createdAt: userData.createdAt
            ? userData.createdAt.toDate()
            : undefined,
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.uid);
      await updateDoc(userRef, {
        role: newRole,
      });

      // Update local state
      setUsers(
        users.map((user) =>
          user.uid === selectedUser.uid ? { ...user, role: newRole } : user
        )
      );

      setIsRoleDialogOpen(false);
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const openDetailsDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const exportUsers = () => {
    // Create CSV content
    const headers = ["Email", "Display Name", "Role", "User ID"];
    const csvContent = [
      headers.join(","),
      ...filteredSortedUsers.map((user) =>
        [user.email, user.displayName || "", user.role, user.uid]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    // Create and download blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mdm-users-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Users exported successfully");
  };

  const toggleSort = (field: "email" | "role" | "displayName") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter users based on search term and active tab
  const filteredUsers = users.filter((user) => {
    const searchValue = searchTerm.toLowerCase();

    // Apply role filter based on active tab
    if (activeTab === "controller" && user.role !== "Controller") return false;
    if (activeTab === "mdm" && user.role !== "MDM") return false;

    // Apply search filter
    return (
      user.email.toLowerCase().includes(searchValue) ||
      (user.displayName || "").toLowerCase().includes(searchValue) ||
      user.role.toLowerCase().includes(searchValue)
    );
  });

  // Apply sorting
  const filteredSortedUsers = [...filteredUsers].sort((a, b) => {
    let valueA: string = a[sortField] || "";
    let valueB: string = b[sortField] || "";

    // For empty displayName values, use email instead
    if (sortField === "displayName") {
      valueA = a.displayName || a.email;
      valueB = b.displayName || b.email;
    }

    const comparison = valueA.localeCompare(valueB);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Calculate user statistics
  const userStats = {
    total: users.length,
    controllers: users.filter((user) => user.role === "Controller").length,
    mdmAdmins: users.filter((user) => user.role === "MDM").length,
  };

  const getSortIndicator = (field: "email" | "role" | "displayName") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return date.toLocaleString();
  };

  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        region: data.region,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success("User created successfully");
      form.reset(defaultValues);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, "users", selectedUser.uid));

      // Delete user from Firebase Auth
      const user = auth.currentUser;
      if (user && user.uid === selectedUser.uid) {
        await deleteUser(user);
      }

      // Update local state
      setUsers(users.filter((user) => user.uid !== selectedUser.uid));

      setIsDeleteDialogOpen(false);
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Create and manage system users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the system with specific roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Controller">Controller</SelectItem>
                          <SelectItem value="MDM">MDM Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="NL">Netherlands</SelectItem>
                          <SelectItem value="SE">Sweden</SelectItem>
                          <SelectItem value="DK">Denmark</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Guide</CardTitle>
            <CardDescription>
              Important information about user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Roles</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-medium">User:</span> Can submit and
                  track their own requests
                </li>
                <li>
                  <span className="font-medium">Approver:</span> Can review and
                  approve/reject requests for their region
                </li>
                <li>
                  <span className="font-medium">Admin:</span> Full system access
                  including user management
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Regional Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  Users can only submit requests for their assigned region
                </li>
                <li>
                  Approvers can only manage requests from their assigned region
                </li>
                <li>Admins have access to all regions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage user roles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchUsers}
            title="Refresh user list"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportUsers} title="Export users">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Controllers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.controllers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">MDM Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.mdmAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>Manage user accounts and roles</span>
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "all" | "controller" | "mdm")
              }
              className="inline-flex"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="controller">Controllers</TabsTrigger>
                <TabsTrigger value="mdm">MDM Admins</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableCaption>
                Showing {filteredSortedUsers.length} of {users.length} users
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSort("email")}
                  >
                    Email{getSortIndicator("email")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSort("displayName")}
                  >
                    Display Name{getSortIndicator("displayName")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSort("role")}
                  >
                    Role{getSortIndicator("role")}
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSortedUsers.map((user) => (
                    <TableRow
                      key={user.uid}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={
                        user.email !== "devs@vattenfall.com"
                          ? () => openDetailsDialog(user)
                          : undefined
                      }
                    >
                      <TableCell className="cursor-pointer">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell>{user.displayName || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "MDM" ? "secondary" : "outline"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.email !== "devs@vattenfall.com" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                User Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDetailsDialog(user)}
                              >
                                <Info className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>Change Role</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(`mailto:${user.email}`)
                                }
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Send Email</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="destructive">Devs</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={newRole}
              onValueChange={(value) => setNewRole(value as UserRole)}
            >
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="Controller" id="controller" />
                <Label htmlFor="controller">Controller</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MDM" id="mdm" />
                <Label htmlFor="mdm">MDM Admin</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-2">
                <div className="flex flex-col items-center justify-center pb-2">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.displayName || selectedUser.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <Badge
                    variant={
                      selectedUser.role === "MDM" ? "secondary" : "outline"
                    }
                    className="mt-2"
                  >
                    {selectedUser.role}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">User Information</h4>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium">User ID:</p>
                    <p className="col-span-2 font-mono text-xs break-all">
                      {selectedUser.uid}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium">Email:</p>
                    <p className="col-span-2">{selectedUser.email}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium">Display Name:</p>
                    <p className="col-span-2">
                      {selectedUser.displayName || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium">Created:</p>
                    <p className="col-span-2">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p className="font-medium">Last Login:</p>
                    <p className="col-span-2">
                      {formatDate(selectedUser.lastLogin)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Quick Actions</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        openEditDialog(selectedUser);
                      }}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Change Role
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(`mailto:${selectedUser.email}`)
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
