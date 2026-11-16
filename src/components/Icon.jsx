// --- Lucide Icon Wrapper Component ---
import { useEffect, useRef } from "react";

export default function Icon({ name, size = 18, className = "" }) {
  const iconRef = useRef(null);

  useEffect(() => {
    if (window.lucide && iconRef.current) {
      window.lucide.createIcons({
        attrs: {
          class: `lucide lucide-${name} ${className}`
        },
        nameAttr: 'data-lucide'
      });
    }
  }, [name, className]);

  return <i ref={iconRef} data-lucide={name} style={{ width: size, height: size }} className={`inline-block ${className}`}></i>;
}