import StatsCard from "@/components/StatsCard";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListOrders, apiListServices, apiListUsers } from "@/lib/api";

const COLORS = [
  "hsl(220, 70%, 25%)", "hsl(25, 95%, 53%)", "hsl(152, 60%, 42%)",
  "hsl(38, 92%, 50%)", "hsl(205, 80%, 50%)",
];

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleString(undefined, { month: "short" }) });
  }
  return out;
}

const AdminDashboard = () => {
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["users", "admin-dashboard"],
    queryFn: () => apiListUsers(),
  });
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["orders", "admin-dashboard"],
    queryFn: () => apiListOrders(),
  });
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ["services", "admin-dashboard"],
    queryFn: () => apiListServices({}),
  });

  const loading = usersLoading || ordersLoading || servicesLoading;
  const error = (usersError || ordersError || servicesError) as Error | null;

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const totalOrders = orders.length;
    const revenue = orders
      .filter((o) => o.status === "DONE")
      .reduce((sum, o) => sum + (Number(o.price_at_order) || 0), 0);

    const months = lastMonths(2);
    const thisKey = months[1]?.key;
    const prevKey = months[0]?.key;
    const thisMonthOrders = orders.filter((o) => monthKey(new Date(o.created_at)) === thisKey).length;
    const prevMonthOrders = orders.filter((o) => monthKey(new Date(o.created_at)) === prevKey).length;
    const growth = prevMonthOrders > 0 ? Math.round(((thisMonthOrders - prevMonthOrders) / prevMonthOrders) * 100) : 0;

    return { totalUsers, totalOrders, revenue, growth };
  }, [users, orders]);

  const charts = useMemo(() => {
    const months = lastMonths(6);
    const byMonthOrders = Object.fromEntries(months.map((m) => [m.key, 0]));
    const byMonthRevenue = Object.fromEntries(months.map((m) => [m.key, 0]));

    for (const o of orders) {
      const k = monthKey(new Date(o.created_at));
      if (!(k in byMonthOrders)) continue;
      byMonthOrders[k] += 1;
      if (o.status === "DONE") byMonthRevenue[k] += Number(o.price_at_order) || 0;
    }

    const barData = months.map((m) => ({ month: m.label, orders: byMonthOrders[m.key] }));
    const revenueData = months.map((m) => ({ month: m.label, revenue: byMonthRevenue[m.key] }));

    const categoryCounts: Record<string, number> = {};
    for (const s of services) {
      const name = s.category?.name ?? "Other";
      categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
    }
    const pieData = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { barData, revenueData, pieData };
  }, [orders, services]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and analytics</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Users" value={String(totals.totalUsers)} icon={Users} trend="All roles" trendUp />
        <StatsCard title="Total Orders" value={String(totals.totalOrders)} icon={ShoppingCart} trend="All statuses" trendUp />
        <StatsCard title="Revenue" value={money(totals.revenue)} icon={DollarSign} trend="Done orders" trendUp />
        <StatsCard title="Growth" value={`${totals.growth}%`} icon={TrendingUp} trend="Orders MoM" trendUp={totals.growth >= 0} />
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Loading analytics…</div> : null}
      {error ? <div className="text-sm text-red-600">{error.message}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services by category</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {charts.pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue (DONE orders)</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
