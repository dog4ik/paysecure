export function requireEnv(key: string) {
  let value = process.env[key];
  if (value === undefined) {
    throw Error(`Required env ${key} is not defined`);
  }
  console.log(`${key}=${value}`);
  return value;
}
