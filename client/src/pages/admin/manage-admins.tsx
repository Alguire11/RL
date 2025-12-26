import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, UserPlus, Shield } from "lucide-react";

export default function AdminManageAdmins() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("admin");

    const { data: admins, isLoading, error } = useQuery<any[]>({
        queryKey: ["/api/superadmin/admins"],
        queryFn: getQueryFn({ on401: "throw" }),
    });

    const inviteMutation = useMutation({
        mutationFn: async () => {
            return apiRequest("POST", "/api/superadmin/admins/invite", {
                email: inviteEmail,
                role: inviteRole
            });
        },
        onSuccess: () => {
            toast({
                title: "Admin Added",
                description: "The user has been granted admin privileges.",
            });
            setIsInviteOpen(false);
            setInviteEmail("");
            queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
        },
        onError: (err: any) => {
            toast({
                title: "Failed to add admin",
                description: err.message,
                variant: "destructive",
            });
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            return apiRequest("PUT", `/api/superadmin/admins/${userId}/role`, { role });
        },
        onSuccess: () => {
            toast({ title: "Role Updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
        },
        onError: (err: any) => {
            toast({
                title: "Update Failed",
                description: err.message,
                variant: "destructive",
            });
        }
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <Shield className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-gray-500">You do not have permission to view this page.</p>
                <Link href="/admin"><Button>Return to Dashboard</Button></Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Navigation />
            <main className="flex-1 p-8 overflow-y-auto ml-16 md:ml-64">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Admins</h1>
                            <p className="text-gray-500 mt-2">Grant and revoke administrative access to RentLedger.</p>
                        </div>
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add New Admin
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Admin User</DialogTitle>
                                    <DialogDescription>
                                        Enter the email of an existing RentLedger user to grant them admin access.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="superadmin">SuperAdmin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => inviteMutation.mutate()}
                                        disabled={inviteMutation.isPending}
                                    >
                                        {inviteMutation.isPending ? "Adding..." : "Grant Access"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Administrators</CardTitle>
                            <CardDescription>
                                Users with privileged access to the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins?.map((admin) => (
                                        <TableRow key={admin.userId}>
                                            <TableCell className="font-medium">
                                                {admin.firstName} {admin.lastName}
                                            </TableCell>
                                            <TableCell>{admin.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                                                    {admin.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={admin.isActive ? "text-green-600 border-green-200 bg-green-50" : "text-gray-400"}>
                                                    {admin.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        defaultValue={admin.role}
                                                        onValueChange={(val) => updateRoleMutation.mutate({ userId: admin.userId, role: val })}
                                                    >
                                                        <SelectTrigger className="w-[110px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="viewer">Viewer</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="superadmin">SuperAdmin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!admins || admins.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                                No admins found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
