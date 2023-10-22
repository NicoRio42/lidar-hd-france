export interface GeojsonObject {
  type: string;
  name: string;
  crs: Crs;
  features: Feature[];
}

export interface Crs {
  type: string;
  properties: Record<string, any>;
}

export interface Feature {
  type: string;
  properties: Record<string, any>;
  geometry: Geometry;
}

export interface Geometry {
  type: string;
  coordinates: Array<Array<Array<[number, number]>>>;
}
