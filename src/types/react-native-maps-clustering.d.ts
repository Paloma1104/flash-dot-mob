declare module "react-native-maps-clustering" {
  import { Component } from "react";
  import { MapViewProps, Region } from "react-native-maps";

  export interface MapViewClusteringProps extends MapViewProps {
    clusterColor?: string;
    clusterTextColor?: string;
    clusterFontFamily?: string;
    clusterRadius?: number;
    accessor?: string;
    minPoints?: number;
    edgePadding?: { top: number; left: number; bottom: number; right: number };
    animationEnabled?: boolean;
    layoutAnimationConf?: any;
    renderCluster?: (cluster: any) => React.ReactNode;
    spiderLineColor?: string;
    // Add other props as needed
  }

  export default class MapView extends Component<MapViewClusteringProps> {
    animateToRegion(region: Region, duration?: number): void;
    animateCamera(camera: any, duration?: number): void;
  }
}
