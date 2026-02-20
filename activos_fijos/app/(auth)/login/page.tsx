import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Activos Fijos</h1>
          <p className="text-slate-500 mt-2">Sistema de Control de Activos</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}