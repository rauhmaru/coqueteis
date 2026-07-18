import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Props = { nome: string; drinkId: string };

export function ShareDrink({ nome, drinkId }: Props) {
  const [copied, setCopied] = useState(false);

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

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: nome, text, url });
        return true;
      } catch {
        // usuário cancelou — silencioso
        return true;
      }
    }
    return false;
  };

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          onClick={async (e) => {
            // Em mobile, tenta compartilhamento nativo antes do dropdown
            if (typeof navigator !== "undefined" && "share" in navigator) {
              e.preventDefault();
              const ok = await nativeShare();
              if (ok) return;
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => open(links.whatsapp)}>WhatsApp</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.telegram)}>Telegram</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.twitter)}>X (Twitter)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(links.facebook)}>Facebook</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" /> Copiado
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" /> Copiar link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
