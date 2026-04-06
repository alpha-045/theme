import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateService,
  apiListCategories,
  apiListServices,
  apiUpdateService,
  toUiServiceStatus,
  type Service,
} from "@/lib/api";
import { useRole } from "@/contexts/RoleContext";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

const OperativeServices = () => {
  const qc = useQueryClient();
  const { user } = useRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiListCategories(),
  });

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services", "operative", user?.id],
    queryFn: () => apiListServices({}),
    enabled: Boolean(user?.id),
    select: (all) => all.filter((s) => s.operative_id === user!.id),
  });

  const byCategoryId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const startCreate = () => {
    setEditing(null);
    setTitle("");
    setCategoryId(categories[0]?.id ?? null);
    setPrice(0);
    setDescription("");
    setOpen(true);
  };

  const startEdit = (svc: Service) => {
    setEditing(svc);
    setTitle(svc.title);
    setCategoryId(svc.category_id);
    setPrice(svc.price);
    setDescription(svc.description);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!categoryId) throw new Error("Choose a category");
      if (!title.trim()) throw new Error("Title is required");
      if (!description.trim()) throw new Error("Description is required");
      if (editing) {
        return apiUpdateService(editing.id, {
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          category_id: categoryId,
        });
      }
      return apiCreateService({
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        status: "ACTIVE",
        category_id: categoryId,
        operative_id: user.id,
      });
    },
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (svc: Service) => apiUpdateService(svc.id, { status: "INACTIVE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your service offerings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={startCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="flex flex-col min-h-[520px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full space-y-4">
                <div>
                  <Label>Service Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Plumbing Repair" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={categoryId ? String(categoryId) : ""}
                    onValueChange={(v) => setCategoryId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price (MAD)</Label>
                  <Input
                    type="number"
                    value={Number.isFinite(price) ? String(price) : ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your service..." />
                </div>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={saveMutation.isPending || !user}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? "Saving…" : "Save Service"}
                </Button>
                {saveMutation.error ? (
                  <div className="text-sm text-red-600">{(saveMutation.error as Error).message}</div>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {!user ? <div className="text-sm text-muted-foreground">Login as an operative to manage services.</div> : null}
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
        {error ? <div className="text-sm text-red-600">{(error as Error).message}</div> : null}
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {(service.category?.name ?? byCategoryId.get(service.category_id)?.name ?? "—")} · {service.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-primary">{money(service.price)}</span>
                <span className="text-xs text-muted-foreground">
                  {toUiServiceStatus(service.status).label}
                </span>
                <Button variant="ghost" size="icon" onClick={() => startEdit(service)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={disableMutation.isPending}
                  onClick={() => disableMutation.mutate(service)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OperativeServices;
