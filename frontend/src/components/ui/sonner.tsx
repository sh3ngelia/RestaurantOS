import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/components/theme/useTheme'

function Toaster(props: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      offset={20}
      mobileOffset={16}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl! border! border-border-strong! bg-popover! text-popover-foreground! shadow-lifted! font-sans!',
          title: 'text-sm! font-medium!',
          description: 'text-[13px]! text-muted-foreground!',
          icon: '[&_svg]:text-primary!',
          error: '[&_[data-icon]_svg]:text-destructive!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
