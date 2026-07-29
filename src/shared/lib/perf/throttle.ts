export function throttle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  intervalMs: number,
): (...args: TArgs) => void {
  let last = 0;

  return (...args: TArgs) => {
    const now = Date.now();
    if (now - last < intervalMs) {
      return;
    }

    last = now;
    callback(...args);
  };
}
