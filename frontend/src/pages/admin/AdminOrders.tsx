import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListOrders, toUiOrderStatus } from "@/lib/api";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const AdminOrders = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "done" | "rejected">("all");

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders", "admin"],
    queryFn: () => apiListOrders(),
  });

  const visible = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => toUiOrderStatus(o.status).status === filter);
  }, [orders, filter]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform-wide order overview</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="p-4 text-sm text-red-600">{(error as Error).message}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Operative</TableHead>
              <TableHead className="hidden md:table-cell">Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{`ORD-${order.id}`}</TableCell>
                <TableCell>{order.client?.name ?? `Client #${order.client_id}`}</TableCell>
                <TableCell className="hidden sm:table-cell">{order.operative?.name ?? `Operative #${order.operative_id}`}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{order.service?.title ?? `Service #${order.service_id}`}</TableCell>
                <TableCell>
                  <StatusBadge status={toUiOrderStatus(order.status).status} label={toUiOrderStatus(order.status).label} />
                </TableCell>
                <TableCell className="font-semibold">{money(order.price_at_order)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
