import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { createRestaurante, INewRestaurante } from "@/services/restauranteService";
import { toast } from "sonner";

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  direccion: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  ciudad: z.string().min(3, { message: "La ciudad debe tener al menos 3 caracteres." }),
  telefono: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional(),
  admin_nombre: z.string().min(2, { message: 'Nombre del admin requerido' }),
  admin_username: z.string().min(3, { message: 'Usuario admin requerido' }).optional(),
  admin_email: z.string().email({ message: "Email inválido." }).optional(),
  admin_password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

export function AddRestaurantePage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      email: "",
      admin_nombre: "",
      admin_username: "",
      admin_email: "",
      admin_password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (newRestaurante: INewRestaurante) => createRestaurante(newRestaurante),
    onSuccess: () => {
      toast.success("Restaurante creado con éxito!");
      form.reset();
    },
    onError: (error) => {
      toast.error("Error al crear el restaurante", { description: error.message });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: any = {
      nombre: values.nombre,
      direccion: values.direccion,
      ciudad: values.ciudad,
      telefono: values.telefono,
      email: values.email,
      first_user: {
        nombre: values.admin_nombre,
        username: values.admin_username,
        email: values.admin_email,
        password: values.admin_password,
      }
    };
    mutation.mutate(payload);
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Añadir Nuevo Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Restaurante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: La Buena Mesa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Av. Siempre Viva 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Springfield" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: +54 9 11 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: contacto@buenamesa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="admin_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Admin</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="admin_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: juan.perez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="admin_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del Admin (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: admin@restaurante.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="admin_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={mutation.isPending} className="mt-4">
                {mutation.isPending ? "Creando..." : "Crear Restaurante"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
