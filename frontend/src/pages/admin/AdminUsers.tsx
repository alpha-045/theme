import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListUsers, type BackendRole } from "@/lib/api";

const AdminUsers = () => {
  const [disableModal, setDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<BackendRole | "all">("all");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users", roleFilter],
    queryFn: () => apiListUsers(roleFilter === "all" ? undefined : { role: roleFilter }),
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q);
    });
  }, [users, query]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v === "all" ? "all" : (v as BackendRole))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="OPERATIVE">Operative</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="p-4 text-sm text-red-600">{(error as Error).message}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span className="text-xs font-semibold capitalize bg-secondary px-2 py-0.5 rounded-full">
                    {user.role.toLowerCase()}
                  </span>
                </TableCell>
                <TableCell><StatusBadge status="active" /></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedUser(user.name); setDisableModal(true); }}
                  >
                    Disable
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        open={disableModal}
        onOpenChange={setDisableModal}
        title="Disable User"
        description={`Disable is not implemented in backend yet. (${selectedUser})`}
        onConfirm={() => setDisableModal(false)}
        confirmLabel="Close"
        destructive
      />
    </div>
  );
};

export default AdminUsers;
