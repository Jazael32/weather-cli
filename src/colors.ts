/** Códigos ANSI de color. Se activan solo en terminal (TTY) y si no está
 *  definida la variable NO_COLOR, para no ensuciar pipes ni archivos. */
const enabled = process.stdout.isTTY === true && !process.env.NO_COLOR;

function colorize(code: string): (text: string) => string {
  return (text: string): string => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);
}

/** Cian: marco del menú y números de opción. */
export const cyan = colorize("36");
/** Amarillo: temperatura y avisos. */
export const yellow = colorize("33");
/** Verde: confirmaciones. */
export const green = colorize("32");
/** Rojo: errores. */
export const red = colorize("31");
/** Negrita: títulos. */
export const bold = colorize("1");
/** Atenuado: detalles secundarios. */
export const dim = colorize("2");
