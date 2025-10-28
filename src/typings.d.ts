// ...existing code...


declare global {
  interface Window { L: any; }
}

declare module 'leaflet.markercluster';
export {};