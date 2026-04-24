import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/adminApi";
import { resolveApiFileUrl, uploadFile } from "@/lib/api";

const PAGE_PRESETS = {
  "about-us": {
    title: "Sobre nos",
    description: "Controla os textos principais da pagina publica Sobre nos.",
    empty: {
      slug: "about-us",
      title: "",
      hero_image_url: "",
      subtitle: "",
      section_title: "",
      section_body: "",
      stores_title: "",
      stores_body: "",
    },
  },
  contact: {
    title: "Contactos",
    description: "Edita o hero, contactos, formulario e a secao de lojas da pagina Contactos.",
    empty: {
      slug: "contact",
      title: "",
      hero_image_url: "",
      subtitle: "",
      social_links: [],
      contact_items: [],
      form_title: "",
      form_body: "",
      stores_title: "",
      stores_body: "",
    },
  },
  blog: {
    title: "Blog",
    description: "Define o titulo e o texto introdutorio da pagina publica de blog.",
    empty: {
      slug: "blog",
      title: "",
      hero_image_url: "",
      subtitle: "",
    },
  },
};

function toCsv(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function mapPresetToPage(slug) {
  const preset = PAGE_PRESETS[slug];
  return {
    slug,
    title: preset?.empty?.title || slug,
  };
}

function buildFormFromPage(page, slug) {
  const preset = PAGE_PRESETS[slug] || { empty: { slug, title: "", subtitle: "" } };
  return {
    ...preset.empty,
    ...page,
    slug,
    title: String(page?.title ?? preset.empty.title ?? ""),
    hero_image_url: String(page?.hero_image_url ?? preset.empty.hero_image_url ?? ""),
    subtitle: String(page?.subtitle ?? preset.empty.subtitle ?? ""),
    section_title: String(page?.section_title ?? preset.empty.section_title ?? ""),
    section_body: String(page?.section_body ?? preset.empty.section_body ?? ""),
    social_links: Array.isArray(page?.social_links) ? page.social_links : preset.empty.social_links || [],
    contact_items: Array.isArray(page?.contact_items) ? page.contact_items : preset.empty.contact_items || [],
    form_title: String(page?.form_title ?? preset.empty.form_title ?? ""),
    form_body: String(page?.form_body ?? preset.empty.form_body ?? ""),
    stores_title: String(page?.stores_title ?? preset.empty.stores_title ?? ""),
    stores_body: String(page?.stores_body ?? preset.empty.stores_body ?? ""),
  };
}

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("about-us");
  const [newSlug, setNewSlug] = useState("");
  const [form, setForm] = useState(buildFormFromPage({}, "about-us"));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await adminApi.listSitePages();
        if (!active) return;
        const safePages = Array.isArray(result) ? result : [];
        setPages(safePages);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load pages.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const availablePages = useMemo(() => {
    const map = new Map();
    Object.keys(PAGE_PRESETS).forEach((slug) => map.set(slug, mapPresetToPage(slug)));
    pages.forEach((page) => {
      const slug = String(page?.slug || "").trim();
      if (!slug) return;
      map.set(slug, page);
    });
    return Array.from(map.values());
  }, [pages]);

  const selectedPage = useMemo(
    () => availablePages.find((page) => String(page?.slug || "") === selectedSlug) || { slug: selectedSlug },
    [availablePages, selectedSlug]
  );

  useEffect(() => {
    setForm(buildFormFromPage(selectedPage, selectedSlug));
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedPage, selectedSlug]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(form.hero_image_url || "");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, form.hero_image_url]);

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      let heroImageUrl = String(form.hero_image_url || "").trim();

      if (imageFile) {
        const uploaded = await uploadFile(imageFile);
        heroImageUrl = String(uploaded?.url || "").trim();
      }

      const payload = {
        title: String(form.title || "").trim(),
        hero_image_url: heroImageUrl,
        subtitle: String(form.subtitle || "").trim(),
      };

      if (selectedSlug === "about-us") {
        payload.section_title = String(form.section_title || "").trim();
        payload.section_body = String(form.section_body || "").trim();
        payload.stores_title = String(form.stores_title || "").trim();
        payload.stores_body = String(form.stores_body || "").trim();
      }

      if (selectedSlug === "contact") {
        payload.social_links = form.social_links;
        payload.contact_items = form.contact_items;
        payload.form_title = String(form.form_title || "").trim();
        payload.form_body = String(form.form_body || "").trim();
        payload.stores_title = String(form.stores_title || "").trim();
        payload.stores_body = String(form.stores_body || "").trim();
      }

      const saved = await adminApi.setSitePage(selectedSlug, payload);
      setPages((prev) => {
        const next = prev.slice();
        const index = next.findIndex((page) => String(page?.slug || "") === selectedSlug);
        if (index >= 0) next[index] = saved;
        else next.push(saved);
        return next;
      });
      setForm((prev) => ({ ...prev, hero_image_url: String(saved?.hero_image_url || heroImageUrl) }));
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Conteudo da pagina guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save page.");
    } finally {
      setSaving(false);
    }
  };

  const addCustomPage = async () => {
    const slug = String(newSlug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      setError("Define um slug valido para a nova pagina.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const saved = await adminApi.setSitePage(slug, { title: slug.replace(/-/g, " "), subtitle: "" });
      setPages((prev) => {
        const next = prev.slice();
        const index = next.findIndex((page) => String(page?.slug || "") === slug);
        if (index >= 0) next[index] = saved;
        else next.push(saved);
        return next;
      });
      setSelectedSlug(slug);
      setNewSlug("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Nova pagina criada no CMS.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create page.");
    } finally {
      setSaving(false);
    }
  };

  const preset = PAGE_PRESETS[selectedSlug];
  const pageTitle = preset?.title || form.title || selectedSlug;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Gere as paginas publicas em modo CMS para o desktop: Sobre nos, Contactos, Blog e futuras paginas."
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle>Paginas</CardTitle>
            <CardDescription>Seleciona uma pagina existente ou cria uma nova entrada CMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">A carregar paginas...</p> : null}
            {availablePages.map((page) => {
              const slug = String(page?.slug || "");
              return (
                <Button
                  key={slug}
                  variant={selectedSlug === slug ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedSlug(slug)}
                >
                  {PAGE_PRESETS[slug]?.title || page?.title || slug}
                </Button>
              );
            })}

            <div className="border-t border-border/60 pt-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Nova pagina</p>
              <div className="flex gap-2">
                <Input
                  value={newSlug}
                  onChange={(event) => setNewSlug(event.target.value)}
                  placeholder="ex: eventos"
                  disabled={saving}
                />
                <Button onClick={() => void addCustomPage()} disabled={saving} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>{preset?.description || "Edita o conteudo desta pagina publica."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Titulo</label>
              <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Imagem do topo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  readOnly
                  value={imageFile ? imageFile.name : form.hero_image_url || ""}
                  placeholder="Seleciona uma imagem para o topo"
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  Upload
                </Button>
                {(imageFile || form.hero_image_url) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setImageFile(null);
                      setForm((prev) => ({ ...prev, hero_image_url: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={saving}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {imagePreview ? (
                <img
                  src={resolveApiFileUrl(imagePreview)}
                  alt={form.title || selectedSlug}
                  className="h-40 w-full rounded-xl border border-border/60 object-cover"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Sem imagem de topo.</p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Texto introdutorio</label>
              <Textarea
                value={form.subtitle}
                onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Texto principal do topo da pagina"
              />
            </div>

            {selectedSlug === "about-us" ? (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Titulo da missao</label>
                  <Input
                    value={form.section_title}
                    onChange={(e) => setForm((prev) => ({ ...prev, section_title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Texto da missao</label>
                  <Textarea
                    value={form.section_body}
                    onChange={(e) => setForm((prev) => ({ ...prev, section_body: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Titulo da secao de lojas</label>
                  <Input
                    value={form.stores_title}
                    onChange={(e) => setForm((prev) => ({ ...prev, stores_title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Texto da secao de lojas</label>
                  <Textarea
                    value={form.stores_body}
                    onChange={(e) => setForm((prev) => ({ ...prev, stores_body: e.target.value }))}
                  />
                </div>
              </>
            ) : null}

            {selectedSlug === "contact" ? (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Redes sociais</label>
                  <Input
                    value={toCsv(form.social_links)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="TIKTOK, INSTAGRAM, FACEBOOK"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Itens de contacto</label>
                  <Input
                    value={toCsv(form.contact_items)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contact_items: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="email, numero, morada"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Titulo do formulario</label>
                  <Input
                    value={form.form_title}
                    onChange={(e) => setForm((prev) => ({ ...prev, form_title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Texto do formulario</label>
                  <Textarea
                    value={form.form_body}
                    onChange={(e) => setForm((prev) => ({ ...prev, form_body: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Titulo da secao de lojas</label>
                  <Input
                    value={form.stores_title}
                    onChange={(e) => setForm((prev) => ({ ...prev, stores_title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Texto da secao de lojas</label>
                  <Textarea
                    value={form.stores_body}
                    onChange={(e) => setForm((prev) => ({ ...prev, stores_body: e.target.value }))}
                  />
                </div>
              </>
            ) : null}

            <Button onClick={() => void onSave()} disabled={saving || loading}>
              {saving ? "A guardar..." : "Guardar pagina"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
