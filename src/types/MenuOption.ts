/** Opción del menú principal. */
export type MenuOption = {
  key: string;
  /** Etiqueta mostrada; puede leer el estado (contador, unidad...). */
  label: () => string;
  /** Acción al elegir la opción; las de salida no necesitan handler. */
  handler?: () => void | Promise<void>;
  /** Si es true, termina el bucle del menú tras ejecutarse. */
  exit?: boolean;
};
