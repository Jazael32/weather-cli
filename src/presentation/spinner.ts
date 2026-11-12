import { cyan } from "../utils/colors.ts";

/** Frames Braille de la animación. */
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Ejecuta una tarea asíncrona mostrando un spinner con su etiqueta; en
 *  entornos sin TTY imprime la etiqueta como línea estática. */
export async function runWithSpinner<T>(label: string, task: () => Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) {
    process.stdout.write(`  ${label}\n`);
    return task();
  }

  let frame = 0;
  const draw = (): void => {
    process.stdout.write(`\r\x1b[K  ${cyan(FRAMES[frame] ?? "")} ${label}`);
    frame = (frame + 1) % FRAMES.length;
  };
  draw();
  const timer = setInterval(draw, 80);
  try {
    return await task();
  } finally {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K"); // limpia la línea del spinner
  }
}
