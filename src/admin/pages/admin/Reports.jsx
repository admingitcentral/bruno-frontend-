import { useEffect, useState } from "react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/adminApi";
const Reports = () => {
  const [stores, setStores] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({ store_id: "", send_time_utc: "09:00", recipient_email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setError("");
      const [storeRows, scheduleRows] = await Promise.all([
        adminApi.listStores(),
        adminApi.listReportSchedules()
      ]);
      setStores(storeRows);
      setSchedules(scheduleRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar relatorios");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return <div className='space-y-8'>
      <PageHeader
    title='Relatórios e analítica'
    description='Configure diariamente relatórios para as suas lojas.'
  />

      {message ? <p className='text-sm'>{message}</p> : null}
      {error ? <p className='text-sm text-red-600'>{error}</p> : null}

      <Card className='rounded-[28px] bg-zinc-100'>
        <CardHeader>
          <CardTitle>Crie Relatórios Diários</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-6 md:grid-cols-4'>
          <select
    className='h-12 w-full rounded-xl border border-slate-400/60 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-500'
    value={form.store_id}
    onChange={(e) => setForm((prev) => ({ ...prev, store_id: e.target.value }))}
  >
            <option value=''>Selecionar loja</option>
            {stores.map((store) => <option key={store.id} value={store.id}>
                {store.name}
              </option>)}
          </select>
          <Input
    className='h-12 rounded-xl border-slate-400/60 focus:border-slate-500 focus:ring-0'
    placeholder='HH:MM (UTC)'
    value={form.send_time_utc}
    onChange={(e) => setForm((prev) => ({ ...prev, send_time_utc: e.target.value }))}
  />
          <Input
    className='h-12 rounded-xl border-slate-400/60 focus:border-slate-500 focus:ring-0'
    placeholder='recipient@email.com'
    value={form.recipient_email}
    onChange={(e) => setForm((prev) => ({ ...prev, recipient_email: e.target.value }))}
  />
          <Button
    className='!h-12 !rounded-xl !bg-black !text-white hover:!bg-black/90'
    onClick={() => {
      if (!form.store_id || !form.send_time_utc || !form.recipient_email) {
        setError("Loja, hora e email sao obrigatorios.");
        setMessage("");
        return;
      }
      void adminApi.createReportSchedule({
        store_id: form.store_id,
        send_time_utc: form.send_time_utc.trim(),
        recipient_email: form.recipient_email.trim(),
        report_type: "pending_orders",
        is_active: true
      }).then(() => load()).then(() => setForm({ store_id: "", send_time_utc: "09:00", recipient_email: "" })).then(() => {
        setError("");
        setMessage("Agendamento guardado");
      }).catch((e) => {
        setMessage("");
        setError(e instanceof Error ? e.message : "Falha ao guardar agendamento");
      });
    }}
  >
            Guardar
          </Button>
        </CardContent>
      </Card>

      <Card className='rounded-[28px] bg-zinc-100'>
        <CardHeader>
          <CardTitle>Agendamentos de relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hora UTC</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Último envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => <TableRow key={schedule.id}>
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell>{schedule.store_name}</TableCell>
                  <TableCell>{schedule.report_type}</TableCell>
                  <TableCell>{schedule.send_time_utc}</TableCell>
                  <TableCell>{schedule.recipient_email}</TableCell>
                  <TableCell>{schedule.last_sent_date || "-"}</TableCell>
                  <TableCell className='flex gap-2'>
                    <Button className='!h-10 !rounded-md !bg-zinc-400 !px-6 !text-white hover:!bg-zinc-500' size='sm' onClick={() => void adminApi.runReportsNow(schedule.id).then(() => {
      setError("");
      setMessage(`Agendamento ${schedule.id} executado`);
    }).catch((e) => {
      setMessage("");
      setError(e instanceof Error ? e.message : "Falha ao executar relatorio");
    })}>
                      Executar
                    </Button>
                    <ConfirmDeleteButton
    entityName={`agendamento #${schedule.id}`}
    onConfirm={() => adminApi.deleteReportSchedule(schedule.id).then(load)}
  />
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
};
var stdin_default = Reports;
export {
  stdin_default as default
};
