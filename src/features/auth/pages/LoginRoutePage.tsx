import { useSearch } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export function LoginRoutePage() {
  const { sesionVencida } = useSearch({ from: "/login" });
  return <LoginPage sesionVencida={sesionVencida} />;
}
