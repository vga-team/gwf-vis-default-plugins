/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface GwfVisGeojsonLayer {
        "active": boolean;
        "addToMapDelegate": (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "geojson": GeoJSON.GeoJsonObject;
        "leaflet": typeof globalThis.L;
        "name": string;
        "options"?: L.GeoJSONOptions;
        "type": 'base-layer' | 'overlay';
    }
    interface GwfVisTileLayer {
        "active": boolean;
        "addToMapDelegate": (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "leaflet": typeof globalThis.L;
        "name": string;
        "options"?: L.TileLayerOptions;
        "type": 'base-layer' | 'overlay';
        "urlTemplate": string;
    }
}
declare global {
    interface HTMLGwfVisGeojsonLayerElement extends Components.GwfVisGeojsonLayer, HTMLStencilElement {
    }
    var HTMLGwfVisGeojsonLayerElement: {
        prototype: HTMLGwfVisGeojsonLayerElement;
        new (): HTMLGwfVisGeojsonLayerElement;
    };
    interface HTMLGwfVisTileLayerElement extends Components.GwfVisTileLayer, HTMLStencilElement {
    }
    var HTMLGwfVisTileLayerElement: {
        prototype: HTMLGwfVisTileLayerElement;
        new (): HTMLGwfVisTileLayerElement;
    };
    interface HTMLElementTagNameMap {
        "gwf-vis-geojson-layer": HTMLGwfVisGeojsonLayerElement;
        "gwf-vis-tile-layer": HTMLGwfVisTileLayerElement;
    }
}
declare namespace LocalJSX {
    interface GwfVisGeojsonLayer {
        "active"?: boolean;
        "addToMapDelegate"?: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "geojson"?: GeoJSON.GeoJsonObject;
        "leaflet"?: typeof globalThis.L;
        "name"?: string;
        "options"?: L.GeoJSONOptions;
        "type"?: 'base-layer' | 'overlay';
    }
    interface GwfVisTileLayer {
        "active"?: boolean;
        "addToMapDelegate"?: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
        "leaflet"?: typeof globalThis.L;
        "name"?: string;
        "options"?: L.TileLayerOptions;
        "type"?: 'base-layer' | 'overlay';
        "urlTemplate"?: string;
    }
    interface IntrinsicElements {
        "gwf-vis-geojson-layer": GwfVisGeojsonLayer;
        "gwf-vis-tile-layer": GwfVisTileLayer;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "gwf-vis-geojson-layer": LocalJSX.GwfVisGeojsonLayer & JSXBase.HTMLAttributes<HTMLGwfVisGeojsonLayerElement>;
            "gwf-vis-tile-layer": LocalJSX.GwfVisTileLayer & JSXBase.HTMLAttributes<HTMLGwfVisTileLayerElement>;
        }
    }
}
