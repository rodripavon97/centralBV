import { useLocation } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export function LoginRoutePage() {
  const { sesionVencida, volverA } = useLocation({
    select: (location) => ({
      sesionVencida: location.state.sesionVencida === true,
      volverA: location.state.volverA,
    }),
  });
  return <LoginPage sesionVencida={sesionVencida} volverA={volverA} />;
}
