import { parseBulaContent } from "@/lib/format-bula-content"

type Props = {
  content: string
  posology?: boolean
}

export function FormattedBulaContent({ content, posology = false }: Props) {
  const blocks = parseBulaContent(content, { posology })

  if (blocks.length === 0) return null

  return (
    <div className="space-y-5 text-[13px] leading-[1.8] text-text-secondary">
      {blocks.map((block, idx) => {
        const key = `${block.type}-${idx}`

        if (block.type === "heading") {
          return (
            <h3
              key={key}
              className={
                block.level === 2
                  ? "text-sm font-semibold text-text pt-4 mt-2 first:pt-0 first:mt-0 border-t border-border/70 first:border-t-0"
                  : "text-[13px] font-semibold text-text pt-2"
              }
            >
              {block.text}
            </h3>
          )
        }

        if (block.type === "list") {
          return (
            <ul key={key} className="list-disc pl-5 space-y-2 marker:text-primary/70 my-1">
              {block.items.map((item) => (
                <li key={item.slice(0, 40)} className="pl-0.5 leading-[1.8]">
                  {item}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === "table") {
          return (
            <div key={key} className="overflow-x-auto rounded-lg border border-border my-2">
              <table className="w-full min-w-[480px] text-left text-[12px]">
                <thead>
                  <tr className="bg-surface-alt border-b border-border">
                    {block.headers.map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-text whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr
                      key={row.join("|").slice(0, 60)}
                      className="border-b border-border/60 last:border-b-0 odd:bg-surface/50"
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={`${cellIdx}-${cell.slice(0, 20)}`} className="px-3 py-2.5 align-top leading-[1.7]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={key} className="text-[13px] leading-[1.8] text-text-secondary mb-1 last:mb-0">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
