import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Check, X } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiListOrders, apiOrderAction, toUiOrderStatus } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const IncomingOrders = () => {
  const qc = useQueryClient();
  const { user } = useRole();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ id: number; action: "accept" | "reject" } | null>(null);

  const { data: incomingOrders = [], isLoading, error } = useQuery({
    queryKey: ["orders", "incoming", user?.id],
    queryFn: () => apiListOrders({ operativeId: user!.id, status: "PENDING" }),
    enabled: Boolean(user?.id),
  });

  const actionMutation = useMutation({
    mutationFn: async (input: { orderId: number; action: "accept" | "reject" }) => {
      if (input.action === "accept") return apiOrderAction(input.orderId, "accept");
      return apiOrderAction(input.orderId, "cancel");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmOpen(false);
    },
  });

  const handleAction = (id: number, action: "accept" | "reject") => {
    setSelectedAction({ id, action });
    setConfirmOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Incoming Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Accept or reject new order requests</p>
      </div>

      <div className="space-y-3">
        {!user ? <div className="text-sm text-muted-foreground">Login as an operative to view incoming orders.</div> : null}
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="text-sm text-red-600">{(error as Error).message}</div> : null}
        {incomingOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{`ORD-${order.id}`}</span>
                  <StatusBadge status={toUiOrderStatus(order.status).status} label={toUiOrderStatus(order.status).label} />
                </div>
                <p className="font-semibold mt-1">{order.service?.title ?? `Service #${order.service_id}`}</p>
                <p className="text-sm text-muted-foreground">
                  {order.client?.name ?? `Client #${order.client_id}`} ·{" "}
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  <span className="font-semibold text-primary">{money(order.price_at_order)}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => handleAction(order.id, "accept")}
                >
                  <Check className="h-4 w-4 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleAction(order.id, "reject")}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={selectedAction?.action === "accept" ? "Accept Order" : "Reject Order"}
        description={`Are you sure you want to ${selectedAction?.action} order ORD-${selectedAction?.id}?`}
        onConfirm={() => {
          if (!selectedAction) return;
          actionMutation.mutate({ orderId: selectedAction.id, action: selectedAction.action });
        }}
        confirmLabel={selectedAction?.action === "accept" ? "Accept" : "Reject"}
        destructive={selectedAction?.action === "reject"}
      />
    </div>
  );
};

export default IncomingOrders;
