
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function AdminApiKeys() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["/api/admin/api-keys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/api-keys");
      return res.json();
    }
  });

  // Create Key Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/admin/api-keys", { name });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setCreatedKey(data.key);
      setNewKeyName("");
      toast({
        title: "API Key Created",
        description: "Please copy the key now. You won't see it again.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      });
    }
  });

  // Revoke Key Mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "API Key Revoked",
        description: "The key is no longer active.",
      });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyName.trim()) {
      createMutation.mutate(newKeyName);
    }
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({ title: "Copied!" });
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">API Keys</h1>
            <p className="text-gray-500 mt-1">Manage partner access tokens</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setCreatedKey(null); // Reset explanation on close
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Partner API Key</DialogTitle>
                <DialogDescription>
                  Generate a new key for a partner integration.
                </DialogDescription>
              </DialogHeader>

              {!createdKey ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Partner / Key Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Acme Corp Integration"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Generating..." : "Generate Key"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Key Generated Successfully</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Copy this key now. It will not be shown again.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2 mt-4">
                    <code className="flex-1 p-3 bg-slate-100 rounded text-sm font-mono break-all border">
                      {createdKey}
                    </code>
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button variant="secondary" className="w-full" onClick={() => setIsCreateOpen(false)}>
                    Done
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading keys...
                  </TableCell>
                </TableRow>
              ) : apiKeys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No API keys found.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys?.map((key: any) => (
                  <TableRow key={key.id} className={!key.isActive ? "bg-gray-50 opacity-60" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Key className="w-4 h-4 mr-2 text-gray-400" />
                        {key.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {key.key.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}>
                        {key.isActive ? "Active" : "Revoked"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {format(new Date(key.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM d, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {key.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this key? This cannot be undone.')) {
                              revokeMutation.mutate(key.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
