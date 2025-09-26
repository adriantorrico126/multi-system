const NotFound = () => {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="max-w-lg w-full mx-4 p-8 bg-white shadow-xl rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="bg-red-50 p-2 rounded-xl">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest font-semibold">Error 404</p>
            <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            Lo sentimos, pero la página que buscas no existe o ha sido movida.
            Verifica la URL o utiliza los accesos rápidos para regresar a una sección conocida del sistema.
          </p>

          <div className="grid gap-3">
            <a
              href="/"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-slate-800">Ir al panel principal</span>
              <span className="text-sm text-blue-600">Dashboard →</span>
            </a>

            <a
              href="/login"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-slate-800">Volver a iniciar sesión</span>
              <span className="text-sm text-blue-600">Login →</span>
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Si crees que esto es un error del sistema, contacta al administrador o revisa el panel de configuración.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
