import { DayPicker, type DayPickerProps } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-surface text-text", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text hover:bg-surface-alt"
        ),
        button_next: cn(
          "absolute right-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text hover:bg-surface-alt"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-text-secondary rounded-md w-9 font-normal text-[0.8rem] capitalize",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md p-0 font-normal transition-colors",
          "hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        ),
        selected:
          "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        today: "bg-primary-light/60 text-primary dark:bg-primary/25 dark:text-primary",
        outside: "text-text-secondary opacity-50",
        disabled: "text-text-secondary opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
        ...props.components,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
