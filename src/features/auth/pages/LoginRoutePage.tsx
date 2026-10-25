import { useLocation } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export function LoginRoutePage() {
  const sesionVencida = useLocation({ select: (location) => location.state.sesionVencida === true });
  return <LoginPage sesionVencida={sesionVencida} />;
}
