import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiListOrders, apiOrderAction, apiUpdateOrder, toUiOrderStatus, type OrderStatus } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

function toSelectValue(status: OrderStatus) {
  if (status === "PENDING") return "pending";
  if (status === "DONE") return "done";
  return "in-progress";
}

const OperativeOrders = () => {
  const qc = useQueryClient();
  const { user } = useRole();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders", "operative", user?.id],
    queryFn: () => apiListOrders({ operativeId: user!.id }),
    enabled: Boolean(user?.id),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { orderId: number; next: "pending" | "in-progress" | "done" }) => {
      if (input.next === "pending") return apiUpdateOrder(input.orderId, { status: "PENDING" });
      if (input.next === "done") return apiOrderAction(input.orderId, "done");
      return apiOrderAction(input.orderId, "in-progress");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Update order statuses</p>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {!user ? <div className="p-4 text-sm text-muted-foreground">Login as an operative to manage orders.</div> : null}
        {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="p-4 text-sm text-red-600">{(error as Error).message}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{`ORD-${order.id}`}</TableCell>
                <TableCell>{order.client?.name ?? `Client #${order.client_id}`}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {order.service?.title ?? `Service #${order.service_id}`}
                </TableCell>
                <TableCell>
                  <StatusBadge status={toUiOrderStatus(order.status).status} label={toUiOrderStatus(order.status).label} />
                </TableCell>
                <TableCell className="font-semibold">{money(order.price_at_order)}</TableCell>
                <TableCell>
                  <Select
                    value={toSelectValue(order.status)}
                    onValueChange={(v) =>
                      updateMutation.mutate({ orderId: order.id, next: v as "pending" | "in-progress" | "done" })
                    }
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OperativeOrders;
