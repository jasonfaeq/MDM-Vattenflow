import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        <div className="space-y-2">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

export { FormSection } 