import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const cardLogos = [
  { name: 'Visa', url: '/logos/visa.png' },
  { name: 'MasterCard', url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png' },
];

const paypalLogo = 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg';

export default function Membresia() {
  const [pagado, setPagado] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    numero: '',
    fecha: '',
    cvc: '',
  });
  const [pagoEnviado, setPagoEnviado] = useState(false);
  const [pagoMetodo, setPagoMetodo] = useState<'tarjeta' | 'paypal'>('tarjeta');

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePago = (e: React.FormEvent) => {
    e.preventDefault();
    setPagoEnviado(true);
    setPagado(true);
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-start gap-8 mt-10 w-full px-2 md:px-0">
      {/* Columna izquierda: Formulario de pago */}
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <span role="img" aria-label="membresía">💳</span>
            Pago Membresía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {cardLogos.map((logo) => (
                <img
                  key={logo.name}
                  src={logo.url}
                  alt={logo.name}
                  className="h-8 w-auto object-contain"
                  style={{ maxWidth: 60 }}
                />
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <Button variant={pagoMetodo === 'tarjeta' ? 'default' : 'outline'} onClick={() => setPagoMetodo('tarjeta')}>Tarjeta</Button>
              <Button variant={pagoMetodo === 'paypal' ? 'default' : 'outline'} onClick={() => setPagoMetodo('paypal')}>
                <img src={paypalLogo} alt="PayPal" className="h-5 w-auto mr-2 inline" /> PayPal
              </Button>
            </div>
            {pagoMetodo === 'tarjeta' && (
              <form className="space-y-4" onSubmit={handlePago} autoComplete="off">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Nombre en la tarjeta</label>
                    <Input name="nombre" value={form.nombre} onChange={handleInput} placeholder="Ej: Juan Pérez" required disabled={pagado} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Número de Tarjeta</label>
                    <Input name="numero" value={form.numero} onChange={handleInput} placeholder="0000 0000 0000 0000" required disabled={pagado} maxLength={19} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Fecha de expiración</label>
                    <Input name="fecha" value={form.fecha} onChange={handleInput} placeholder="MM/AA" required disabled={pagado} maxLength={5} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">CVC/CVV</label>
                    <Input name="cvc" value={form.cvc} onChange={handleInput} placeholder="123" required disabled={pagado} maxLength={4} />
                  </div>
                </div>
                <Button type="submit" className="w-full text-lg mt-2" disabled={pagado}>
                  {pagado ? '¡Pago registrado!' : 'Enviar pago'}
                </Button>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span role="img" aria-label="candado">🔒</span> Pagos encriptados y seguros
                </div>
              </form>
            )}
            {pagoMetodo === 'paypal' && (
              <div className="flex flex-col items-center py-8">
                <img src={paypalLogo} alt="PayPal" className="h-10 w-auto mb-4" />
                <Button className="w-full text-lg" disabled>
                  Próximamente
                </Button>
              </div>
            )}
            {pagoEnviado && (
              <div className="mt-4 text-green-600 font-semibold text-center">
                ¡Gracias por tu pago! Tu membresía está activa.
              </div>
            )}
            <div className="text-xs text-gray-500 mt-6">
              Al finalizar la compra, aceptas nuestros <a href="#" className="underline">Términos de servicio</a> y confirmas que has leído nuestra <a href="#" className="underline">Política de privacidad</a>. Puedes cancelar los pagos recurrentes en cualquier momento.
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Columna derecha: Resumen del pedido */}
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Resumen del pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Membresía POS</span>
              <span>Bs 1300</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Periodo</span>
              <span>1 mes</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Impuestos</span>
              <span>Incluidos</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>Bs 1300</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 