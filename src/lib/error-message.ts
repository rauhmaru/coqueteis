export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}