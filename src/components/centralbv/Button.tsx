import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { buttonClass, type ButtonVariant } from "./estilos";

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

const AnclaBoton = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }>(
  function AnclaBoton({ variant, className, ...props }, ref) {
    return <a ref={ref} className={buttonClass(variant, className)} {...props} />;
  },
);

const LinkBoton = createLink(AnclaBoton);

/** Link de TanStack Router con aspecto de botón (rutas tipadas). */
export const ButtonLink: LinkComponent<typeof AnclaBoton> = (props) => <LinkBoton {...props} />;
