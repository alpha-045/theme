import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import { ArrowLeft, Clock, MapPin, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiCreateOrder, apiGetService } from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const ServiceDetail = () => {
  const { id } = useParams();
  const serviceId = Number(id);
  const navigate = useNavigate();
  const { token } = useRole();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => apiGetService(serviceId),
    enabled: Number.isFinite(serviceId),
  });

  const orderMutation = useMutation({
    mutationFn: () => apiCreateOrder({ service_id: serviceId, address, note: note.trim() || undefined }, token),
    onSuccess: (order) => {
      setOpen(false);
      navigate(`/client/order/${order.id}`);
    },
  });

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Link to="/client" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </Link>

      <Card>
        <CardContent className="p-6">
          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {error ? <div className="text-sm text-red-600">{(error as Error).message}</div> : null}
          {!service ? null : (
            <>
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl">🔧</span>
            <div>
              <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-full">
                {service.category?.name ?? "—"}
              </span>
              <h1 className="text-2xl font-bold mt-2">{service.title}</h1>
         
            </div>
          </div>

          <div className="prose prose-sm text-muted-foreground mb-6">
            <p>{service.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
         
 
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{service.operative?.name ?? "—"}</span>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Service Price</p>
              <p className="text-3xl font-bold text-primary">{money(service.price)}</p>
            </div>
            {!token ? (
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto"
                onClick={() => navigate("/login")}
              >
                Login to Order
              </Button>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
                    Order Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Order service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Address</div>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, street…" />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Note (optional)</div>
                      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any details…" />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!address.trim() || orderMutation.isPending}
                      onClick={() => orderMutation.mutate()}
                    >
                      {orderMutation.isPending ? "Creating…" : "Confirm order"}
                    </Button>
                    {orderMutation.error ? (
                      <div className="text-sm text-red-600">{(orderMutation.error as Error).message}</div>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
            </>
          )}
        </CardContent>
      </Card>

   
    </div>
  );
};

export default ServiceDetail;
