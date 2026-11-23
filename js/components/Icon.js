
const { useEffect, useRef } = React;

function Icon({ name, size = 18, className = "" }) {
  const iconRef = useRef(null);

  useEffect(() => {
    if (window.lucide && iconRef.current) {
      window.lucide.createIcons({
        attrs: {
          class: `lucide lucide-${name} ${className}`
        },
        nameAttr: "data-lucide"
      });
    }
  }, [name, className]);

  return (
    <i
      ref={iconRef}
      data-lucide={name}
      style={{ width: size, height: size }}
      className={`inline-block ${className}`}
    ></i>
  );
}

window.Icon = Icon;
