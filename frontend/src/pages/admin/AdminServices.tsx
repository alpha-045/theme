import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import { useMemo, useState } from "react";
import { Eye, Power } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiListServices, apiUpdateService, toUiServiceStatus, type Service } from "@/lib/api";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const AdminServices = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);
  const qc = useQueryClient();

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services", "admin"],
    queryFn: () => apiListServices({}),
  });

  const disableMutation = useMutation({
    mutationFn: async (svc: Service) => {
      const next = svc.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return apiUpdateService(svc.id, { status: next });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["services"] });
      setConfirmOpen(false);
    },
  });

  const sorted = useMemo(() => services.slice().sort((a, b) => b.id - a.id), [services]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Services Moderation</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and moderate platform services</p>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="p-4 text-sm text-red-600">{(error as Error).message}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="hidden sm:table-cell">Operative</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.title}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {service.operative?.name ?? `Operative #${service.operative_id}`}
                </TableCell>
                <TableCell className="hidden md:table-cell">{service.category?.name ?? `Category #${service.category_id}`}</TableCell>
                <TableCell className="font-semibold">{money(service.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={toUiServiceStatus(service.status).status} label={toUiServiceStatus(service.status).label} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelected(service);
                        setConfirmOpen(true);
                      }}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={selected?.status === "ACTIVE" ? "Disable service" : "Enable service"}
        description={selected ? `${selected.title}` : ""}
        onConfirm={() => {
          if (!selected) return;
          disableMutation.mutate(selected);
        }}
        confirmLabel={selected?.status === "ACTIVE" ? "Disable" : "Enable"}
        destructive={selected?.status === "ACTIVE"}
      />
    </div>
  );
};

export default AdminServices;
