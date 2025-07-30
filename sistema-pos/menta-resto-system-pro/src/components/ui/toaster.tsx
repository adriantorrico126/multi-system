import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Filtrar propiedades que no deberían pasarse al componente Toast
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key, value]) => {
            // Excluir propiedades que son números, valores nulos, o propiedades que no deberían ser atributos HTML
            if (typeof value === 'number') return false;
            if (value === null || value === undefined) return false;
            if (typeof key === 'number') return false;
            if (key === 'id' || key === 'title' || key === 'description' || key === 'action') return false;
            // Excluir cualquier propiedad que contenga 'id' en el nombre
            if (key.toLowerCase().includes('id')) return false;
            return true;
          })
        );
        
        return (
          <Toast key={id} {...filteredProps}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
