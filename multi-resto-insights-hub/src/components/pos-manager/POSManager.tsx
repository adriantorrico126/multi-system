import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, LayoutGrid, Printer, Users, Database, Link as LinkIcon } from "lucide-react";

export const POSManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">POS Manager</h2>
          <p className="text-sm text-slate-600">Configura y administra la red de POS, impresoras y flujos.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="printers">Impresoras</TabsTrigger>
          <TabsTrigger value="channels">Conexiones</TabsTrigger>
          <TabsTrigger value="layouts">Layout POS</TabsTrigger>
          <TabsTrigger value="roles">Roles/Permisos</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4"/>Configuración General</CardTitle>
                <CardDescription>Parámetros globales del POS.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="secondary">Abrir configuración</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Printer className="h-4 w-4"/>Impresión</CardTitle>
                <CardDescription>Agentes, colas y pruebas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm">Gestionar impresoras</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-4 w-4"/>POS</CardTitle>
                <CardDescription>Plantillas y módulos.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline">Editar layout</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="printers">
          <Card>
            <CardHeader>
              <CardTitle>Impresoras y agentes</CardTitle>
              <CardDescription>Registro, estado y pruebas de impresión.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Placeholder: aquí listaremos agentes conectados y sus colas.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/>Conexiones</CardTitle>
              <CardDescription>WebSocket, HTTP, autenticación.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Placeholder: configuración de servidores y tokens.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts">
          <Card>
            <CardHeader>
              <CardTitle>Layout POS</CardTitle>
              <CardDescription>Temas, breakpoints y módulos visibles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Placeholder: editor de layout y previsualización.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4"/>Roles y permisos</CardTitle>
              <CardDescription>Accesos a módulos del POS.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Placeholder: matriz de permisos por rol.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4"/>Datos</CardTitle>
              <CardDescription>Sincronización e integridad.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Placeholder: diagnósticos de datos y acciones.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


