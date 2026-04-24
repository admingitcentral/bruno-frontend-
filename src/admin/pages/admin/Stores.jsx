import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { adminApi } from "@/lib/adminApi";
import { resolveApiFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
const emptyForm = {
  name: "",
  region_district: "",
  priority_level: "1",
  address: "",
  image_url: "",
  is_active: true
};
const toForm = (store) => ({
  name: store.name || "",
  region_district: store.region_district || "",
  priority_level: String(store.priority_level ?? 1),
  address: store.address || "",
  image_url: store.image_url || "",
  is_active: store.is_active !== false
});
const Stores = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [routingMode, setRoutingMode] = useState("region");
  const [savingRoutingMode, setSavingRoutingMode] = useState(false);

  const [uploadingImageForStoreId, setUploadingImageForStoreId] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [formImageFile, setFormImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [activeStoreActionId, setActiveStoreActionId] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("");
  const [formImagePreviewUrl, setFormImagePreviewUrl] = useState("");
  const uploadTargetStore = useMemo(
    () => rows.find((store) => store.id === uploadingImageForStoreId) || null,
    [rows, uploadingImageForStoreId]
  );
  const activeStoreCount = useMemo(
    () => rows.filter((store) => store.is_active !== false).length,
    [rows]
  );
  const canDeleteStores = rows.length > 1;
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [storesResult, routingResult] = await Promise.all([
        adminApi.listStores(),
        adminApi.getRoutingMode()
      ]);
      const safeRows = Array.isArray(storesResult) ? storesResult : [];
      setRows(safeRows);
      const mode = routingResult?.mode === "quantity" ? "quantity" : "region";
      setRoutingMode(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar lojas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreviewUrl("");
      return;
    }
    const previewUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImageFile]);
  useEffect(() => {
    if (!formImageFile) {
      setFormImagePreviewUrl("");
      return;
    }
    const previewUrl = URL.createObjectURL(formImageFile);
    setFormImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [formImageFile]);
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormImageFile(null);
  };
  const handleSaveStore = async () => {
    const name = form.name.trim();
    const regionDistrict = form.region_district.trim();
    const address = form.address.trim();
    const priorityLevel = Number(form.priority_level);
    if (!name) {
      setError("O nome da loja é obrigatório.");
      setSuccess("");
      return;
    }
    if (!regionDistrict) {
      setError("A região/distrito é obrigatória.");
      setSuccess("");
      return;
    }
    if (!Number.isInteger(priorityLevel) || priorityLevel < 1) {
      setError("A prioridade deve ser um número inteiro maior que 0.");
      setSuccess("");
      return;
    }
    if (!address) {
      setError("A morada é obrigatória.");
      setSuccess("");
      return;
    }
    let imageUrl = String(form.image_url || '').trim();
    const payload = {
      name,
      region_district: regionDistrict,
      priority_level: priorityLevel,
      address,
      image_url: imageUrl || null,
      is_active: form.is_active
    };
    try {
      setSavingStore(true);
      setError("");
      setSuccess("");
      if (formImageFile) {
        const uploadResult = await adminApi.uploadFile(formImageFile);
        if (!uploadResult?.url) {
          throw new Error("Falha ao fazer upload da imagem");
        }
        imageUrl = uploadResult.url;
        payload.image_url = imageUrl;
      }
      if (editingId != null) {
        await adminApi.updateStore(editingId, payload);
        setSuccess("Loja atualizada.");
      } else {
        await adminApi.createStore(payload);
        setSuccess("Loja criada.");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao guardar a loja");
      setSuccess("");
    } finally {
      setSavingStore(false);
    }
  };
  const handleDeleteStore = async (storeId) => {
    try {
      setError("");
      setSuccess("");
      await adminApi.deleteStore(storeId);
      setSuccess("Loja eliminada.");
      if (editingId === storeId) {
        resetForm();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao eliminar a loja");
      setSuccess("");
    }
  };
  const handleToggleStoreStatus = async (store) => {
    if (store.is_active !== false && activeStoreCount <= 1) {
      setError("É necessário pelo menos uma loja ativa.");
      setSuccess("");
      return;
    }
    try {
      setActiveStoreActionId(store.id);
      setError("");
      setSuccess("");
      await adminApi.updateStore(store.id, { is_active: store.is_active === false });
      setSuccess(`Loja ${store.is_active === false ? "ativada" : "desativada"}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar o estado da loja");
      setSuccess("");
    } finally {
      setActiveStoreActionId(null);
    }
  };
  const handleSaveRoutingMode = async () => {
    try {
      setSavingRoutingMode(true);
      setError("");
      setSuccess("");
      await adminApi.setRoutingMode(routingMode);
      setSuccess(`Modo de roteamento atualizado para ${routingMode === "quantity" ? "quantidade" : "região"}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar o modo de roteamento");
      setSuccess("");
    } finally {
      setSavingRoutingMode(false);
    }
  };

  const handleUploadStoreImage = async (storeId) => {
    if (!selectedImageFile) {
      setError("Por favor selecione uma imagem.");
      setSuccess("");
      return;
    }

    try {
      setUploadingImageForStoreId(storeId);
      setError("");
      setSuccess("");

      // Upload file first
      const uploadResult = await adminApi.uploadFile(selectedImageFile);
      if (!uploadResult?.url) {
        throw new Error("Falha ao fazer upload da imagem");
      }

      // Then save the URL to the store
      await adminApi.uploadStoreImage(storeId, uploadResult.url);
      setSuccess("Imagem da loja atualizada.");
      setSelectedImageFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar imagem da loja");
      setSuccess("");
    } finally {
      setUploadingImageForStoreId(null);
    }
  };
  return <div className="space-y-6">
      <PageHeader
    title="Gestão de lojas"
    description="Gerir lojas, prioridade, moradas e imagens para roteamento por distância."
  />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      <Card className="rounded-2xl bg-zinc-100">
        <CardHeader>
          <CardTitle>Modo de roteamento de encomendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Escolha como as novas encomendas são atribuídas: pela loja mais próxima com base na morada/localização ou pela maior quantidade de stock disponível.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
    type="button"
    className={routingMode === "region" ? "!h-10 !rounded-md !bg-black !px-4 !text-white hover:!bg-black/90" : "!h-10 !rounded-md !bg-white !px-4 !text-black border border-slate-400/60 hover:!bg-zinc-100"}
    onClick={() => setRoutingMode("region")}
  >
              Mapa e Distância
            </Button>
            <Button
    type="button"
    className={routingMode === "quantity" ? "!h-10 !rounded-md !bg-black !px-4 !text-white hover:!bg-black/90" : "!h-10 !rounded-md !bg-white !px-4 !text-black border border-slate-400/60 hover:!bg-zinc-100"}
    onClick={() => setRoutingMode("quantity")}
  >
              Prioridade de Quantidade
            </Button>
            <Button
    type="button"
    className="!h-10 !rounded-md !bg-white !px-6 !text-[#6a8f97] border border-[#6a8f97] hover:!bg-[#6a8f97]/10"
    disabled={savingRoutingMode}
    onClick={() => void handleSaveRoutingMode()}
  >
              {savingRoutingMode ? "A guardar..." : "Guardar Modo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-zinc-100">
        <CardHeader>
          <CardTitle>Lojas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Distrito</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
  {loading ? (
    <TableRow>
      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
        A carregar lojas...
      </TableCell>
    </TableRow>
  ) : rows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
        Ainda não existem lojas configuradas.
      </TableCell>
    </TableRow>
  ) : (
    rows.map((row) => {
      const isActive = row.is_active !== false;
      const isBusy = activeStoreActionId === row.id;
      const isLastActive = isActive && activeStoreCount <= 1;

      return (
        <TableRow key={String(row.id)}>
          <TableCell>{row.id}</TableCell>
          <TableCell>{row.name}</TableCell>
          <TableCell>{isActive ? "Ativa" : "Inativa"}</TableCell>
          <TableCell>{row.region_district || "-"}</TableCell>
          <TableCell>{row.priority_level ?? "-"}</TableCell>
          <TableCell>{row.address || "-"}</TableCell>

          <TableCell>
            {row.image_url ? (
              <div className="flex items-center gap-2">
                <img
                  src={resolveApiFileUrl(row.image_url)}
                  alt={row.name}
                  className="h-8 w-8 rounded object-cover"
                />
                <Button
                  size="sm"
                  className="!h-7 !bg-amber-600 text-white"
                  onClick={() => setUploadingImageForStoreId(row.id)}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="!h-7 !bg-slate-500 text-white"
                onClick={() => setUploadingImageForStoreId(row.id)}
              >
                Upload
              </Button>
            )}
          </TableCell>
          <TableCell className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingId(row.id);
                setForm(toForm(row));
                setFormImageFile(null);
              }}
            >
              Editar
            </Button>

            <Button
              size="sm"
              disabled={isBusy || isLastActive}
              onClick={() => handleToggleStoreStatus(row)}
            >
              {isBusy ? "A guardar..." : isActive ? "Desativar" : "Ativar"}
            </Button>

            <ConfirmDeleteButton
              triggerLabel="Apagar"
              confirmLabel="Apagar"
              entityName={`loja "${row.name}"`}
              onConfirm={() => handleDeleteStore(row.id)}
              disabled={!canDeleteStores}
            />
          </TableCell>
        </TableRow>
      );
    })
  )}
</TableBody>
          </Table>
          {!canDeleteStores ? <p className="mt-3 text-xs text-muted-foreground">
              Pelo menos uma loja deve permanecer configurada.
            </p> : null}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] bg-zinc-100">
        <CardHeader>
          <CardTitle className="text-3xl font-normal">{editingId != null ? "Editar Loja" : "Criar Loja"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <Input
    className="h-12 rounded-xl border-slate-400/60 focus:ring-0 focus:border-slate-500"
    placeholder="Nome da Loja"
    value={form.name}
    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
  />
          <Input
    className="h-12 rounded-xl border-slate-400/60 focus:ring-0 focus:border-slate-500"
    placeholder="Região/Distrito"
    value={form.region_district}
    onChange={(e) => setForm((prev) => ({ ...prev, region_district: e.target.value }))}
  />
          <Input
    className="h-12 rounded-xl border-slate-400/60 focus:ring-0 focus:border-slate-500"
    placeholder="1"
    type="number"
    min={1}
    value={form.priority_level}
    onChange={(e) => setForm((prev) => ({ ...prev, priority_level: e.target.value }))}
  />
          <Input
    className="h-12 rounded-xl border-slate-400/60 focus:ring-0 focus:border-slate-500"
    placeholder="Morada"
    value={form.address}
    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
  />
          <div className="flex h-12 items-center rounded-xl border border-slate-400/60 bg-white px-4 text-sm text-muted-foreground">
            A morada e o distrito da loja serão usados para calcular a loja mais próxima.
          </div>
          <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-400/60 bg-white px-4 text-sm">
            <input
    type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
  />
            Ativar
          </label>
          <div className="md:col-span-3 rounded-xl border border-slate-400/60 bg-white p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium">Imagem da loja</p>
                <p className="text-xs text-muted-foreground">
                  A imagem enviada aqui será mostrada na secção de lojas do site público.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                  className="block text-sm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Pré-visualização</p>
                {formImagePreviewUrl || form.image_url ? (
                  <img
                    src={formImagePreviewUrl || resolveApiFileUrl(form.image_url)}
                    alt="Pré-visualização da loja"
                    className="h-28 w-28 rounded-xl border object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-xl border text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:col-span-3">
            <Button className="!h-14 !w-56 !rounded-xl !bg-black !text-white hover:!bg-black/90" disabled={savingStore} onClick={() => void handleSaveStore()}>
              {savingStore ? "A guardar..." : editingId != null ? "Guardar alterações" : "Criar Loja"}
            </Button>
            {editingId != null ? <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button> : null}
          </div>
        </CardContent>
      </Card>


      {uploadingImageForStoreId != null && (
        <Card className="rounded-2xl bg-zinc-100">
          <CardHeader>
            <CardTitle>
              Carregar Imagem da Loja
              {uploadTargetStore?.name ? `: ${uploadTargetStore.name}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadTargetStore?.image_url ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Imagem atual</p>
                <img
                  src={resolveApiFileUrl(uploadTargetStore.image_url)}
                  alt={uploadTargetStore.name || "Loja"}
                  className="h-32 w-32 rounded-xl border object-cover"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione uma imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-blue-500 file:px-3 file:py-1 file:text-white"
              />
              <p className="text-xs text-muted-foreground">Máx. 5MB. Formatos: JPG, PNG, GIF, etc.</p>
            </div>

            {selectedImageFile && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedImageFile.name}</p>
                <div className="text-xs text-gray-600">Tamanho: {(selectedImageFile.size / 1024).toFixed(2)} KB</div>
                {selectedImagePreviewUrl ? <img
                    src={selectedImagePreviewUrl}
                    alt="Pré-visualização"
                    className="h-32 w-32 rounded-xl border object-cover"
                  /> : null}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="!h-10 !rounded-md !bg-green-600 !px-6 !text-white hover:!bg-green-700"
                disabled={!selectedImageFile || uploadingImageForStoreId == null}
                onClick={() => void handleUploadStoreImage(uploadingImageForStoreId)}
              >
                Guardar Imagem
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setUploadingImageForStoreId(null);
                  setSelectedImageFile(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>;
};
var stdin_default = Stores;
export {
  stdin_default as default
};
