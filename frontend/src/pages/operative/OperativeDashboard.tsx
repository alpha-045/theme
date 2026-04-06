import StatsCard from "@/components/StatsCard";
import { ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListOrders, toUiOrderStatus } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const OperativeDashboard = () => {
  const { user } = useRole();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders", "operative", "dashboard", user?.id],
    queryFn: () => apiListOrders({ operativeId: user!.id }),
    enabled: Boolean(user?.id),
  });

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const doneOrders = orders.filter((o) => o.status === "DONE").length;
    const earnings = orders
      .filter((o) => o.status === "DONE")
      .reduce((sum, o) => sum + (Number(o.price_at_order) || 0), 0);
    return { totalOrders, doneOrders, earnings };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Operative Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} trend={`${stats.doneOrders} done`} trendUp />
        <StatsCard title="Earnings" value={money(stats.earnings)} icon={DollarSign} trend="From done orders" trendUp />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? <div className="text-sm text-muted-foreground">Login as an operative to see your dashboard.</div> : null}
          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {error ? <div className="text-sm text-red-600">{(error as Error).message}</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{`ORD-${order.id}`}</TableCell>
                  <TableCell>{order.client?.name ?? `Client #${order.client_id}`}</TableCell>
                  <TableCell className="text-muted-foreground">{order.service?.title ?? `Service #${order.service_id}`}</TableCell>
                  <TableCell><StatusBadge status={toUiOrderStatus(order.status).status} label={toUiOrderStatus(order.status).label} /></TableCell>
                  <TableCell className="font-semibold">{money(order.price_at_order)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperativeDashboard;
