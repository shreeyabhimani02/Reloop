import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({
  label,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}

      <input
        className={`ui-input ${className}`}
        {...props}
      />
    </div>
  );
}