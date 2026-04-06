import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StarRating from "@/components/StarRating";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiListServices, type Service } from "@/lib/api";

function money(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount)} MAD`;
}

function serviceEmoji(name?: string) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb")) return "🔧";
  if (n.includes("elect")) return "⚡";
  if (n.includes("clean")) return "🧹";
  if (n.includes("hvac") || n.includes("ac")) return "❄️";
  if (n.includes("paint")) return "🎨";
  if (n.includes("garden")) return "🌿";
  return "🛠️";
}

const ClientBrowse = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: () => apiListServices({ status: "ACTIVE" }),
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const name = s.category?.name;
      if (name) set.add(name);
    }
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [services]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => (selectedCategory === "All" ? true : s.category?.name === selectedCategory))
      .filter((s) => {
        if (!q) return true;
        const hay = `${s.title} ${s.category?.name ?? ""} ${s.operative?.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [services, query, selectedCategory]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Browse Services</h1>
        <p className="text-muted-foreground text-sm mt-1">Find the right service for your needs</p>
      </div>

    

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading services…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{(error as Error).message}</div>
        ) : null}

        {visible.map((service: Service) => (
          <Link key={service.id} to={`/client/service/${service.id}`}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{serviceEmoji(service.category?.name)}</span>
                  <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-full">
                    {service.category?.name ?? "—"}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">by {service.operative?.name ?? "—"}</p>
                <StarRating rating={0} size={14} />
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-center">
                <span className="text-xl font-bold text-primary">{money(service.price)}</span>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ClientBrowse;
