let _count = 0;

export function increment(): number {
  return ++_count;
}

export function getCount(): number {
  return _count;
}
