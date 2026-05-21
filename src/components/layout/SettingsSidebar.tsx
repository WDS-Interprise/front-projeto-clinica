import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"



const groups = [

  {

    title: "Configurações da clínica",

    items: [

      { to: "/configuracoes/usuarios", label: "Usuários da clínica" },

      { to: "/configuracoes/clinicas", label: "Dados da clínica" },
      { to: "/configuracoes/whatsapp", label: "WhatsApp" },

    ],

  },

]



export default function SettingsSidebar() {

  return (

    <aside className="w-56 shrink-0 border-r border-border bg-surface pr-4">

      <p className="text-xs text-text-secondary px-3 mb-4 leading-relaxed">

        Assinatura, cobrança e exportação ficam no{" "}

        <a href="/backoffice/plataforma" className="text-primary hover:underline" target="_blank" rel="noreferrer">

          backoffice

        </a>{" "}

        (somente donos).

      </p>

      {groups.map((group) => (

        <div key={group.title} className="mb-6">

          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-3 mb-2">

            {group.title}

          </p>

          <nav className="space-y-0.5">

            {group.items.map(({ to, label }) => (

              <NavLink

                key={to}

                to={to}

                className={({ isActive }) =>

                  cn(

                    "block px-3 py-2 rounded-lg text-sm transition-colors",

                    isActive

                      ? "bg-primary-light text-primary font-medium"

                      : "text-text-secondary hover:bg-surface-alt hover:text-text"

                  )

                }

              >

                {label}

              </NavLink>

            ))}

          </nav>

        </div>

      ))}

    </aside>

  )

}


