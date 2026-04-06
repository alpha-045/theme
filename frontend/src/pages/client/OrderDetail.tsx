import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { apiGetOrder, toUiOrderStatus } from "@/lib/api";

const OrderDetail = () => {
  const { id } = useParams();
  const orderId = Number(id);
  const [rating, setRating] = useState(0);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiGetOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const badge = order ? toUiOrderStatus(order.status) : null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Link to="/client/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <Card>
        <CardContent className="p-6">
          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {error ? <div className="text-sm text-red-600">{(error as Error).message}</div> : null}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">{order ? `ORD-${order.id}` : id}</h1>
              <p className="text-sm text-muted-foreground">{order?.service?.title ?? "—"}</p>
            </div>
            {badge ? <StatusBadge status={badge.status} label={badge.label} /> : <StatusBadge status="pending" />}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-muted-foreground">Operative</p>
              <p className="font-medium">{order?.operative?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">
                {order?.created_at ? new Date(order.created_at).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{order?.service?.category?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-primary text-lg">
                {order ? `${Math.round(order.price_at_order)} MAD` : "—"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4" /> Payment
            </h3>
            <Button disabled className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
              Pay (demo)
            </Button>
          </div>
        </CardContent>
      </Card>

    
    </div>
  );
};

export default OrderDetail;
