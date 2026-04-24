import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/admin/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";

const emptyItem = { quote: "", author: "", role: "" };

export default function Testimonials() {
  const [items, setItems] = useState([emptyItem]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await adminApi.getAboutUs();
        if (!active) return;
        const testimonials = Array.isArray(payload?.testimonials) && payload.testimonials.length > 0
          ? payload.testimonials.map((item) => ({
              quote: String(item?.quote || ""),
              author: String(item?.author || ""),
              role: String(item?.role || ""),
            }))
          : [emptyItem];
        setItems(testimonials);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load testimonials.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const hasContent = useMemo(
    () => items.some((item) => String(item.quote || "").trim() || String(item.author || "").trim() || String(item.role || "").trim()),
    [items]
  );

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [{ ...emptyItem }];
    });
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        testimonials: items
          .map((item) => ({
            quote: String(item.quote || "").trim(),
            author: String(item.author || "").trim(),
            role: String(item.role || "").trim(),
          }))
          .filter((item) => item.quote || item.author || item.role),
      };
      await adminApi.setAboutUs(payload);
      setMessage("Testimonials saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save testimonials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        description="Define the customer testimonials shown on the public About Us page."
        actions={
          <Button onClick={addItem} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add testimonial
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-4">
        {items.map((item, index) => (
          <Card key={`testimonial-${index}`} className="border-border/60 bg-card/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Testimonial {index + 1}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input
                value={item.quote}
                onChange={(event) => updateItem(index, "quote", event.target.value)}
                placeholder="Customer quote"
                disabled={loading || saving}
              />
              <Input
                value={item.author}
                onChange={(event) => updateItem(index, "author", event.target.value)}
                placeholder="Customer name"
                disabled={loading || saving}
              />
              <Input
                value={item.role}
                onChange={(event) => updateItem(index, "role", event.target.value)}
                placeholder="Customer role or label"
                disabled={loading || saving}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={() => void onSave()} disabled={loading || saving || !hasContent}>
        {saving ? "Saving..." : "Save testimonials"}
      </Button>
    </div>
  );
}
