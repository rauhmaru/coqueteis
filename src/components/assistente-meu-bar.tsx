import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizar } from "@/lib/abv";

type IngredienteBasico = { id: string; nome: string };

type Props = {
  catalogo: IngredienteBasico[];
  onSalvar: (ingredientes: IngredienteBasico[]) => Promise<void>;
  onConcluir: () => void;
};

const COMUNS = [
  { nome: "Cachaça", termos: ["cachaca"] },
  { nome: "Vodka", termos: ["vodka"] },
  { nome: "Gin", termos: ["gin"] },
  { nome: "Rum", termos: ["rum", "rum branco"] },
  { nome: "Whisky", termos: ["whisky", "whiskey"] },
  { nome: "Tequila", termos: ["tequila"] },
  { nome: "Limão", termos: ["limao", "suco de limao"] },
  { nome: "Açúcar", termos: ["acucar", "xarope de acucar"] },
  { nome: "Água com gás", termos: ["agua com gas"] },
  { nome: "Água tônica", termos: ["agua tonica"] },
  { nome: "Hortelã", termos: ["hortela"] },
  { nome: "Gelo", termos: ["gelo"] },
  { nome: "Leite condensado", termos: ["leite condensado"] },
  { nome: "Laranja", termos: ["laranja", "suco de laranja"] },
  { nome: "Morango", termos: ["morango"] },
  { nome: "Maracujá", termos: ["maracuja"] },
  { nome: "Campari", termos: ["campari"] },
  { nome: "Vermute", termos: ["vermute", "vermouth"] },
  { nome: "Licor de cassis", termos: ["licor de cassis", "creme de cassis"] },
  { nome: "Energético", termos: ["energetico"] },
] as const;

function encontrar(catalogo: IngredienteBasico[], termos: readonly string[]) {
  const exato = catalogo.find((item) => termos.includes(normalizar(item.nome)));
  if (exato) return exato;
  return catalogo.find((item) => termos.some((termo) => normalizar(item.nome).includes(termo)));
}

export function AssistenteMeuBar({ catalogo, onSalvar, onConcluir }: Props) {
  const [passo, setPasso] = useState(1);
  const [selecionados, setSelecionados] = useState<IngredienteBasico[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const comuns = useMemo(
    () => COMUNS.map((item) => ({ ...item, ingrediente: encontrar(catalogo, item.termos) })),
    [catalogo],
  );
  const idsSelecionados = useMemo(() => new Set(selecionados.map((item) => item.id)), [selecionados]);
  const sugestoes = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return [];
    return catalogo
      .filter((item) => !idsSelecionados.has(item.id) && normalizar(item.nome).includes(termo))
      .slice(0, 8);
  }, [busca, catalogo, idsSelecionados]);

  const alternar = (ingrediente: IngredienteBasico | undefined) => {
    if (!ingrediente) return;
    setSelecionados((atuais) =>
      atuais.some((item) => item.id === ingrediente.id)
        ? atuais.filter((item) => item.id !== ingrediente.id)
        : [...atuais, ingrediente],
    );
  };

  const persistir = async (acao: () => void) => {
    if (selecionados.length === 0) {
      toast.error("Escolha pelo menos um ingrediente para montar seu bar.");
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(selecionados);
      acao();
    } catch (erro) {
      toast.error((erro as Error).message || "Não foi possível salvar seu bar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section aria-labelledby="assistente-titulo" className="rounded-lg border border-primary/40 bg-card p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Passo {passo} de 3</p>
          <h2 id="assistente-titulo" className="mt-1 font-serif text-2xl text-foreground">
            {passo === 1 ? "O que você tem em casa?" : passo === 2 ? "Falta algo?" : "Seu bar"}
          </h2>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2" aria-label={`Progresso: passo ${passo} de 3`}>
        {[1, 2, 3].map((numero) => (
          <span key={numero} className={`h-1.5 rounded-full ${numero <= passo ? "bg-primary" : "bg-muted"}`} aria-hidden="true" />
        ))}
      </div>

      {passo === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Toque em tudo que já faz parte do seu bar.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {comuns.map(({ nome, ingrediente }) => {
              const ativo = ingrediente ? idsSelecionados.has(ingrediente.id) : false;
              return (
                <Button
                  key={nome}
                  type="button"
                  variant={ativo ? "default" : "outline"}
                  className="h-auto min-h-12 justify-start whitespace-normal px-3 py-2 text-left"
                  aria-pressed={ativo}
                  disabled={!ingrediente}
                  title={ingrediente ? undefined : `${nome} não está disponível no catálogo`}
                  onClick={() => alternar(ingrediente)}
                >
                  {ativo && <Check className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />}
                  {nome}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="assistente-busca">Busque outro ingrediente</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input id="assistente-busca" value={busca} onChange={(event) => setBusca(event.target.value)} className="min-h-11 pl-10" placeholder="Ex.: bourbon, xarope, abacaxi" autoFocus autoComplete="off" />
            </div>
            {sugestoes.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border" aria-label="Sugestões de ingredientes">
                {sugestoes.map((item) => (
                  <li key={item.id}>
                    <Button type="button" variant="ghost" className="min-h-11 w-full justify-start rounded-none" onClick={() => { alternar(item); setBusca(""); }}>
                      <span className="truncate">{item.nome}</span>
                      <span className="ml-auto text-xs text-muted-foreground">Adicionar</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Já escolhidos</p>
            <ul className="flex flex-wrap gap-2">
              {selecionados.map((item) => (
                <li key={item.id}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => alternar(item)}>
                    {item.nome}<X className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Remover {item.nome}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {passo === 3 && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Seu bar está pronto com {selecionados.length} ingrediente{selecionados.length === 1 ? "" : "s"}. Você pode ajustar preços e volumes depois.</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {selecionados.map((item) => (
              <li key={item.id} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{item.nome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-between gap-3">
        {passo > 1 ? (
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setPasso((atual) => atual - 1)} disabled={salvando}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Voltar
          </Button>
        ) : <span />}
        {passo < 3 ? (
          <Button type="button" className="min-h-11" disabled={salvando || selecionados.length === 0} onClick={() => void persistir(() => setPasso((atual) => atual + 1))}>
            Continuar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" className="min-h-11" disabled={salvando} onClick={() => void persistir(onConcluir)}>
            Ver o que dá para fazer <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
}