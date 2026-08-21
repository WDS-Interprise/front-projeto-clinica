import type { SVGProps } from "react"

export function UsersThreeIcon({ className, strokeWidth = 1.5, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="6.5" r="2.4" />
      <circle cx="5.8" cy="8" r="2" />
      <circle cx="18.2" cy="8" r="2" />
      <path d="M8.2 19c.35-2.35 1.85-3.7 3.8-3.7s3.45 1.35 3.8 3.7" />
      <path d="M2.8 18.5c.3-1.9 1.5-3 3.2-3 1.05 0 1.95.4 2.55 1.15" />
      <path d="M15.45 16.65c.6-.75 1.5-1.15 2.55-1.15 1.7 0 2.9 1.1 3.2 3" />
    </svg>
  )
}
