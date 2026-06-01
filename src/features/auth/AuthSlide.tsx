import React from "react";
import { ArrowRight, Database, LockKeyhole, Mail, Search, TableProperties, WandSparkles } from "lucide-react";
import { motion } from "motion/react";

interface AuthSlideProps {
  isLoggingIn: boolean;
  handleConnect: () => void;
}

export const AuthSlide: React.FC<AuthSlideProps> = ({ isLoggingIn, handleConnect }) => {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-6xl mx-auto mt-2 sm:mt-8"
      id="slide-auth"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
        <div className="pt-4 lg:pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-6">
            <LockKeyhole className="w-3.5 h-3.5 text-emerald-600" />
            Gmail se conecta despues de iniciar sesion
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-normal text-slate-950 leading-[1.02] mb-5">
            Organizr
          </h2>

          <p className="text-lg sm:text-xl text-slate-600 leading-8 max-w-2xl mb-8 font-semibold">
            Convierte correos repetidos en tablas listas para revisar, automatizar y enviar a tus herramientas sin copiar datos a mano.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <button
              onClick={handleConnect}
              disabled={isLoggingIn}
              className="h-12 px-5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-white transition-all font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm select-none inline-flex items-center justify-center gap-3"
              id="gsi-create-account-button"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] bg-white rounded-full">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? "Abriendo Google..." : "Crear cuenta"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleConnect}
              disabled={isLoggingIn}
              className="h-12 px-5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-100 transition-all font-extrabold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm select-none inline-flex items-center justify-center gap-2"
              id="gsi-login-button"
            >
              Iniciar sesion
            </button>
          </div>

          <p className="text-xs leading-5 text-slate-500 max-w-xl font-semibold">
            Usamos Firebase Auth para la identidad. El acceso Gmail es de solo lectura y se solicita cuando necesitas buscar correos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-base">Del inbox al dato</h3>
                <p className="text-xs text-slate-500 font-bold">Correos repetidos, estructura clara</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Search className="w-5 h-5 text-cyan-700 mb-3" />
                <h4 className="font-black text-slate-900 text-sm mb-1">Encuentra ejemplos</h4>
                <p className="text-xs text-slate-600 leading-5 font-semibold">Busca por asunto o texto y selecciona correos candidatos.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <WandSparkles className="w-5 h-5 text-amber-600 mb-3" />
                <h4 className="font-black text-slate-900 text-sm mb-1">Detecta el esquema</h4>
                <p className="text-xs text-slate-600 leading-5 font-semibold">Gemini propone campos y datos extraidos para revisar.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Database className="w-5 h-5 text-emerald-700 mb-3" />
                <h4 className="font-black text-slate-900 text-sm mb-1">Guarda extractores</h4>
                <p className="text-xs text-slate-600 leading-5 font-semibold">Reutiliza scripts aprobados para nuevos correos similares.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <TableProperties className="w-5 h-5 text-rose-600 mb-3" />
                <h4 className="font-black text-slate-900 text-sm mb-1">Revisa tablas</h4>
                <p className="text-xs text-slate-600 leading-5 font-semibold">Visualiza extracciones y envia resultados a un webhook.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
            <LockKeyhole className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-5 font-bold">
              Primero creas o inicias sesion. Despues eliges cuando conectar Gmail para que el flujo de trabajo aparezca con tu cuenta activa.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
