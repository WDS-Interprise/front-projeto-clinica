import { useEffect } from "react"
import { COMPANY_LEGAL } from "@/lib/company-legal"

export const SITE_ORIGIN = COMPANY_LEGAL.siteUrl.replace(/\/$/, "")

export const HOME_TITLE = "ClinMax: Gestão clínica"
export const HOME_DESCRIPTION =
  "A ClinMax é a plataforma de gestão clínica e prontuário eletrônico para consultórios e equipes. Agenda, prontuário, prescrições, WhatsApp e finanças."

export function absoluteUrl(path: string) {
  if (path === "/") return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

type JsonLd = Record<string, unknown>

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!(el instanceof HTMLMetaElement)) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!(el instanceof HTMLLinkElement)) {
    el = document.createElement("link")
    el.rel = "canonical"
    document.head.appendChild(el)
  }
  el.href = href
}

export function usePageSeo(input: {
  title: string
  description: string
  path: string
  jsonLd?: JsonLd
}) {
  const json = input.jsonLd ? JSON.stringify(input.jsonLd) : ""

  useEffect(() => {
    const url = absoluteUrl(input.path)
    document.title = input.title
    upsertMeta("name", "description", input.description)
    upsertMeta("property", "og:title", input.title)
    upsertMeta("property", "og:description", input.description)
    upsertMeta("property", "og:url", url)
    upsertMeta("property", "og:type", "website")
    upsertMeta("property", "og:locale", "pt_BR")
    upsertMeta("property", "og:image", absoluteUrl("/favicon.png"))
    upsertCanonical(url)

    const id = "clinmax-jsonld"
    const current = document.getElementById(id)
    if (json) {
      const script = current instanceof HTMLScriptElement ? current : document.createElement("script")
      script.id = id
      script.type = "application/ld+json"
      script.textContent = json
      if (!current) document.head.appendChild(script)
    } else {
      current?.remove()
    }
  }, [input.title, input.description, input.path, json])
}

export const HOME_JSON_LD: JsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "ClinMax",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/favicon.png"),
      email: COMPANY_LEGAL.contactEmail,
    },
    {
      "@type": "WebSite",
      name: "ClinMax",
      url: absoluteUrl("/"),
      description: HOME_DESCRIPTION,
      publisher: {
        "@type": "Organization",
        name: "ClinMax",
        url: absoluteUrl("/"),
      },
    },
  ],
}

export function breadcrumbJsonLd(pageName: string, path: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: absoluteUrl(path),
      },
    ],
  }
}
