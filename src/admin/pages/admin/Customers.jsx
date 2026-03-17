import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatRelativeDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  const now = new Date();
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(parsed).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return parsed.toLocaleDateString();
}

function getCustomerStatus(customer) {
  return customer.orderCount > 0 ? "Active" : "Inactive";
}

function buildCustomers(orders) {
  const grouped = new Map();

  for (const order of Array.isArray(orders) ? orders : []) {
    const email = normalizeEmail(order.customer_email);
    if (!email) continue;

    const name = normalizeText(order.customer_name) || email;
    const total = Number(order.total || 0);
    const createdAt = order.created_at || null;
    const existing = grouped.get(email);

    if (!existing) {
      grouped.set(email, {
        id: email,
        name,
        email,
        orderCount: 1,
        totalSpent: Number.isFinite(total) ? total : 0,
        lastActivityAt: createdAt,
        lastOrderNumber: normalizeText(order.order_number) || `#${order.id}`,
        orders: [order],
      });
      continue;
    }

    existing.orderCount += 1;
    existing.totalSpent += Number.isFinite(total) ? total : 0;
    existing.orders.push(order);

    const existingDate = existing.lastActivityAt ? new Date(existing.lastActivityAt).getTime() : 0;
    const currentDate = createdAt ? new Date(createdAt).getTime() : 0;
    if (currentDate >= existingDate) {
      existing.lastActivityAt = createdAt;
      existing.lastOrderNumber = normalizeText(order.order_number) || `#${order.id}`;
      existing.name = name || existing.name;
    }
  }

  return Array.from(grouped.values())
    .map((customer) => ({
      ...customer,
      status: getCustomerStatus(customer),
      orders: customer.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }))
    .sort((a, b) => {
      const dateA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const dateB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return dateB - dateA || b.orderCount - a.orderCount;
    });
}

const Customers = () => {
  const [orders, setOrders] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await adminApi.listOrders();
        if (!active) return;
        setOrders(Array.isArray(rows) ? rows : []);
      } catch (loadError) {
        if (!active) return;
        setOrders([]);
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar clientes.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  useEffect(() => {
    if (!customers.length) {
      setSelectedCustomerId("");
      return;
    }
    if (!customers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestao de clientes"
        description="Rever atividade dos clientes, encomendas e controlo de contas."
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="rounded-[28px] border-border/60 bg-zinc-100">
          <CardHeader>
            <CardTitle className="font-display text-xl">Lista de clientes</CardTitle>
            <CardDescription>Clientes reais agrupados a partir das encomendas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Encomendas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      A carregar clientes...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Nenhum cliente encontrado nas encomendas.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-black/5",
                        selectedCustomerId === customer.id && "bg-black/5"
                      )}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/60 bg-zinc-100">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-normal">Perfil do Cliente</CardTitle>
            <CardDescription>
              {selectedCustomer ? "Resumo do cliente selecionado." : "Selecione o cliente"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomer ? (
              <>
                <div className="rounded-xl bg-[#6a8f97] p-6 text-white">
                  <p className="text-base font-medium">{selectedCustomer.name}</p>
                  <p className="text-xs opacity-90">{selectedCustomer.email}</p>
                  <p className="mt-2 text-xs opacity-90">
                    Ultima atividade: {formatRelativeDate(selectedCustomer.lastActivityAt)}
                  </p>
                </div>

                <div className="space-y-3 px-1 text-sm">
                  <p className="font-medium">Encomendas: {selectedCustomer.orderCount}</p>
                  <p className="font-medium">Total gasto: {formatCurrency(selectedCustomer.totalSpent)}</p>
                  <p className="font-medium">Ultima encomenda: {selectedCustomer.lastOrderNumber || "-"}</p>
                </div>

                <div className="flex flex-wrap gap-4 sm:flex-nowrap">
                  <Button
                    size="sm"
                    disabled
                    className="!h-12 !min-w-[190px] !flex-1 !rounded-2xl !bg-black !text-white disabled:opacity-100"
                  >
                    Redefinir Password
                  </Button>
                  <Button
                    size="sm"
                    disabled
                    className="!h-12 !min-w-[190px] !flex-1 !rounded-2xl !bg-[#e4312f] !text-white hover:!bg-[#e4312f] disabled:opacity-100"
                  >
                    Desativar Conta
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda nao existem clientes reais para mostrar nesta pagina.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Customers;
