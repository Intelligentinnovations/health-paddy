export async function getPromiseAttribute<T, TP extends keyof T>(
  data: Promise<T>,
  parameter: TP
) {
  return (await data)[parameter];
}
