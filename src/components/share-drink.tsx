import { useState } from "react";
import { Share2, Link as LinkIcon, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getSignedImageUrl } from "@/lib/queries";

type Props = { nome: string; drinkId: string; imagemPath?: string | null };

export function ShareDrink({ nome, drinkId, imagemPath }: Props) {
  const [copied, setCopied] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/drinks/${drinkId}`
      : `/drinks/${drinkId}`;
  const text = `Confira a receita de ${nome}`;
  const enc = encodeURIComponent;

  const links = {
    whatsapp: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const shareWithImage = async () => {
    if (!imagemPath) return;
    setSharingImage(true);
    try {
      const signed = await getSignedImageUrl(imagemPath);
      if (!signed) throw new Error("Imagem indisponível.");
      const res = await fetch(signed);
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
      const file = new File([blob], `${nome.replace(/[^\w-]+/g, "_")}.${ext}`, {
        type: blob.type || "image/jpeg",
      });

      const payload: ShareData = { title: nome, text: `${text}\n${url}`, url, files: [file] };
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(payload);
      } else {
        // Fallback: baixa a imagem e copia o link para o usuário anexar manualmente
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        try { await navigator.clipboard.writeText(`${text} ${url}`); } catch { /* noop */ }
        toast.success("Imagem baixada e link copiado. Anexe manualmente onde quiser compartilhar.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error((e as Error).message || "Falha ao compartilhar imagem.");
      }
    } finally {
      setSharingImage(false);
    }
  };

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {imagemPath && (
          <>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); shareWithImage(); }}
              disabled={sharingImage}
            >
              {sharingImage ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparando…</>
              ) : (
                <><ImageIcon className="h-4 w-4 mr-2" /> Compartilhar com imagem</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => open(links.whatsapp)}>WhatsApp</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.telegram)}>Telegram</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.twitter)}>X (Twitter)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.facebook)}>Facebook</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink}>
          {copied ? (
            <><Check className="h-4 w-4 mr-2" /> Copiado</>
          ) : (
            <><LinkIcon className="h-4 w-4 mr-2" /> Copiar link</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
