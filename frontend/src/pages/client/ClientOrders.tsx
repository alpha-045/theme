import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiListOrders, toUiOrderStatus } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

function dateText(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

const ClientOrders = () => {
  const { user } = useRole();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders", "client", user?.id],
    queryFn: () => apiListOrders({ clientId: user!.id }),
    enabled: Boolean(user?.id),
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your service orders</p>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {!user ? <div className="p-4 text-sm text-muted-foreground">Login to view your orders.</div> : null}
        {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="p-4 text-sm text-red-600">{(error as Error).message}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="hidden sm:table-cell">Operative</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const badge = toUiOrderStatus(order.status);
              return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{`ORD-${order.id}`}</TableCell>
                <TableCell className="font-medium">{order.service?.title ?? `Service #${order.service_id}`}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {order.operative?.name ?? `Operative #${order.operative_id}`}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{dateText(order.created_at)}</TableCell>
                <TableCell><StatusBadge status={badge.status} label={badge.label} /></TableCell>
                <TableCell className="font-semibold">{money(order.price_at_order)}</TableCell>
                <TableCell>
                  <Link to={`/client/order/${order.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </Link>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientOrders;
