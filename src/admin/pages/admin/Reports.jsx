import { useEffect, useState } from "react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/adminApi";

const initialForm = { store_id: "", send_time_utc: "09:00", recipient_email: "" };

function Reports() {
  const [stores, setStores] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reportStatus, setReportStatus] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [storeRows, scheduleRows] = await Promise.all([
        adminApi.listStores(),
        adminApi.listReportSchedules(),
      ]);
      const status = await adminApi.getReportStatus();
      setStores(Array.isArray(storeRows) ? storeRows : []);
      setSchedules(Array.isArray(scheduleRows) ? scheduleRows : []);
      setReportStatus(status && typeof status === "object" ? status : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar relatorios");
      setStores([]);
      setSchedules([]);
      setReportStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!form.store_id || !form.send_time_utc || !form.recipient_email) {
      setMessage("");
      setError("Loja, hora UTC e email sao obrigatorios.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await adminApi.createReportSchedule({
        store_id: form.store_id,
        send_time_utc: form.send_time_utc.trim(),
        recipient_email: form.recipient_email.trim(),
        report_type: "pending_orders",
        is_active: true,
      });
      await load();
      setForm(initialForm);
      setMessage("Agendamento guardado. O email recebera o relatorio e a analitica da loja.");
    } catch (e) {
      setMessage("");
      setError(e instanceof Error ? e.message : "Falha ao guardar agendamento");
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async (scheduleId) => {
    try {
      setRunningId(scheduleId);
      setError("");
      setMessage("");
      await adminApi.runReportsNow(scheduleId);
      await load();
      setMessage(`Relatorio ${scheduleId} executado. Verifique o email configurado.`);
    } catch (e) {
      setMessage("");
      setError(e instanceof Error ? e.message : "Falha ao executar relatorio");
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports and analytics"
        description="Set up daily reports for your stores."
      />

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {reportStatus && !reportStatus.email_configured ? (
        <p className="text-sm text-amber-700">
          Email delivery is not configured in the backend. Set `EMAIL_USER` and `EMAIL_PASS` in the backend `.env`.
        </p>
      ) : null}

      <Card className="rounded-[28px] bg-zinc-100">
        <CardHeader>
          <CardTitle>Create Daily Reports</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-4">
          <select
            className="h-12 w-full rounded-xl border border-slate-400/60 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-500"
            value={form.store_id}
            onChange={(e) => setForm((prev) => ({ ...prev, store_id: e.target.value }))}
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          <Input
            className="h-12 rounded-xl border-slate-400/60 focus:border-slate-500 focus:ring-0"
            placeholder="HH:MM (UTC)"
            value={form.send_time_utc}
            onChange={(e) => setForm((prev) => ({ ...prev, send_time_utc: e.target.value }))}
          />

          <Input
            className="h-12 rounded-xl border-slate-400/60 focus:border-slate-500 focus:ring-0"
            placeholder="recipient@email.com"
            value={form.recipient_email}
            onChange={(e) => setForm((prev) => ({ ...prev, recipient_email: e.target.value }))}
          />

          <Button
            className="!h-12 !rounded-xl !bg-black !text-white hover:!bg-black/90"
            onClick={() => void handleCreate()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Keep"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] bg-zinc-100">
        <CardHeader>
          <CardTitle>Report scheduling</CardTitle>
        </CardHeader>
        <CardContent>
          {reportStatus ? (
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white px-4 py-3 text-sm">
                <p className="text-black/55">Email delivery</p>
                <p className="font-semibold">{reportStatus.email_configured ? "Configured" : "Missing config"}</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-sm">
                <p className="text-black/55">Active schedules</p>
                <p className="font-semibold">{reportStatus.schedules_active ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-sm">
                <p className="text-black/55">Sender</p>
                <p className="font-semibold break-all">{reportStatus.email_from || "-"}</p>
              </div>
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hour UTC</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next run UTC</TableHead>
                <TableHead>Last submission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Loading report schedules...
                  </TableCell>
                </TableRow>
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    No report schedules created yet.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.id}</TableCell>
                    <TableCell>{schedule.store_name}</TableCell>
                    <TableCell>{schedule.report_type}</TableCell>
                    <TableCell>{schedule.send_time_utc}</TableCell>
                    <TableCell>{schedule.recipient_email}</TableCell>
                    <TableCell>{schedule.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{schedule.next_run_utc || "-"}</TableCell>
                    <TableCell>{schedule.last_sent_date || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        className="!h-10 !rounded-md !bg-zinc-400 !px-6 !text-white hover:!bg-zinc-500"
                        size="sm"
                        disabled={runningId === schedule.id}
                        onClick={() => void handleRunNow(schedule.id)}
                      >
                        {runningId === schedule.id ? "Sending..." : "Run"}
                      </Button>
                      <ConfirmDeleteButton
                        entityName={`schedule #${schedule.id}`}
                        onConfirm={() => adminApi.deleteReportSchedule(schedule.id).then(load)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Reports;
