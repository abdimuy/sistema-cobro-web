import { NavigateFunction } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;

export function setNavigateRef(fn: NavigateFunction) {
  navigateRef = fn;
}

export function appNavigate(path: string) {
  navigateRef?.(path);
}
