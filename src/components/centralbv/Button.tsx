import type { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router";
import { buttonClass, type ButtonVariant } from "./estilos";

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant, className, ...props }: LinkProps & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
