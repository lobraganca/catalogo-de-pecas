import type { ReactNode } from "react";

// Os quatro estados do padrão visual: fundo no tom 50, borda no 200 e
// texto no 700 da mesma cor.
export function Alerta({
  tipo,
  titulo,
  children,
}: {
  tipo: "info" | "success" | "warning" | "danger";
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === "danger" ? "alert" : "status"}>
      <p className="alerta-titulo">{titulo}</p>
      {children && <div className="alerta-texto">{children}</div>}
    </div>
  );
}
