import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/slug";

export function MixologiaMarkdown({ conteudo }: { conteudo: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        h2: ({ children }) => {
          const texto = String(children);
          return <h2 id={slugify(texto)} className="scroll-mt-20 font-serif text-2xl text-primary">{children}</h2>;
        },
        h3: ({ children }) => <h3 className="font-serif text-xl text-foreground">{children}</h3>,
        a: ({ children, href }) => (
          <a href={href} rel="noopener noreferrer" className="text-primary underline underline-offset-4">{children}</a>
        ),
        ul: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">{children}</blockquote>,
        code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{children}</code>,
        table: ({ children }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
        th: ({ children }) => <th className="border border-border bg-muted p-2 text-left">{children}</th>,
        td: ({ children }) => <td className="border border-border p-2">{children}</td>,
      }}
    >
      {conteudo}
    </ReactMarkdown>
  );
}