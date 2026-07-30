import React, { useRef, useMemo, useCallback, useEffect, useImperativeHandle } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MarkerData = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  selected?: boolean;
  popular?: boolean;
  image_url?: string;
  onPress?: () => void;
};

type MapViewProps = {
  style?: any;
  region?: Region;
  onRegionChangeComplete?: (r: Region) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  markers?: MarkerData[];
};

function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta)) + 1;
}

const DEF_REGION = { latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.06, longitudeDelta: 0.06 };

function buildMapHtml(
  region: Region,
  markers: { id: string; latitude: number; longitude: number; title?: string; selected?: boolean; popular?: boolean; image_url?: string }[]
): string {
  const markersJson = JSON.stringify(markers);
  const initialZoom = deltaToZoom(region.latitudeDelta);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden}
.marker-pin{
  border-radius:50% 50% 50% 0;
  border:3px solid #fff;
  box-shadow:0 2px 4px rgba(0,0,0,0.3);
  display:flex;align-items:center;justify-content:center;
  transform:rotate(-45deg);
  transition:all .2s;
  cursor:pointer
}
.marker-pin-inner{
  transform:rotate(45deg);
  font-size:13px;line-height:1;color:#fff;font-weight:700
}
.marker-selected{
  z-index:10000!important;
  box-shadow:0 0 0 4px rgba(255,122,0,0.35),0 2px 8px rgba(0,0,0,0.3)
}
.user-dot{
  width:18px;height:18px;
  background:#4285F4;
  border:3px solid #fff;
  border-radius:50%;
  box-shadow:0 0 0 2px rgba(66,133,244,0.3)
}
.user-dot-wrap{animation:pulse 2s infinite}
@keyframes pulse{
  0%{box-shadow:0 0 0 0 rgba(66,133,244,0.4)}
  70%{box-shadow:0 0 0 14px rgba(66,133,244,0)}
  100%{box-shadow:0 0 0 0 rgba(66,133,244,0)}
}
.leaflet-control-attribution{display:none!important}
.marker-tooltip{font-size:12px;font-weight:600}
</style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var reg = ${JSON.stringify(region)};
  var initialMarkers = ${markersJson};
  var userDot = null;
  var showUserDot = false;
  var map = L.map("map",{
    center:[reg.latitude,reg.longitude],
    zoom:${initialZoom},
    zoomControl:false,
    attributionControl:false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:19,
    detectRetina:true
  }).addTo(map);

  var markerLayer = L.layerGroup().addTo(map);

  function makeIcon(m){
    var size = m.selected ? 38 : (m.popular ? 34 : 30);
    var bg = m.popular ? "#D97706" : "#FF7A00";
    var cls = "marker-pin";
    if(m.selected) cls += " marker-selected";
    var innerHtml = m.image_url
      ? '<span class="marker-pin-inner"><img src="'+m.image_url+'" style="width:'+(size-8)+'px;height:'+(size-8)+'px;border-radius:50%;object-fit:cover;display:block" /></span>'
      : '<span class="marker-pin-inner">⛽</span>';
    return L.divIcon({
      className:"",
      html:'<div class="'+cls+'" style="width:'+size+'px;height:'+size+'px;background:'+bg+'">'+innerHtml+'</div>',
      iconSize:[size,size],
      iconAnchor:[size/2,size],
      popupAnchor:[0,-size]
    });
  }

  window.updateMarkers = function(arr){
    markerLayer.clearLayers();
    (arr||[]).forEach(function(m){
      var icon = makeIcon(m);
      var mk = L.marker([m.latitude,m.longitude],{icon:icon}).addTo(markerLayer);
      mk.on("click",function(){
        try{ window.ReactNativeWebView.postMessage(JSON.stringify({type:"markerPress",id:m.id})) }
        catch(e){}
      });
      if(m.title){
        mk.bindTooltip(m.title,{direction:"top",offset:[0,-12],className:"marker-tooltip"});
      }
    });
  };
  window.updateMarkers(initialMarkers);

  // user location dot (controlled by parent)
  function setUserDot(lat,lng){
    if(userDot){
      userDot.setLatLng([lat,lng]);
    }else{
      userDot = L.marker([lat,lng],{
        icon:L.divIcon({
          className:"",
          html:'<div class="user-dot-wrap"><div class="user-dot"></div></div>',
          iconSize:[18,18],
          iconAnchor:[9,9]
        }),
        zIndexOffset:100000,
        interactive:false
      }).addTo(map);
    }
  }
  window.setUserLocation = function(lat,lng){
    setUserDot(lat,lng);
  };
  window.setUserLocationEnabled = function(enabled){
    showUserDot=enabled;
    if(!enabled && userDot){ map.removeLayer(userDot); userDot=null; }
  };

  // region change -> RN
  map.on("moveend",function(){
    var c = map.getCenter();
    var b = map.getBounds();
    try{
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:"regionChange",
        region:{
          latitude:c.lat,
          longitude:c.lng,
          latitudeDelta:b.getNorthEast().lat-b.getSouthWest().lat,
          longitudeDelta:b.getNorthEast().lng-b.getSouthWest().lng
        }
      }));
    }catch(e){}
  });

  window.__map = map;

  try{ window.ReactNativeWebView.postMessage(JSON.stringify({type:"ready"})) }
  catch(e){}
})();
</script>
</body>
</html>`;
}

const MapView = React.forwardRef<any, MapViewProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const animatingRef = useRef(false);
  const ignoreRegionSyncRef = useRef(false);

  const initRegion = useRef(props.region ?? DEF_REGION);
  const initMarkers = useRef(
    (props.markers ?? []).map((m) => ({
      id: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      title: m.title,
      selected: m.selected,
      popular: m.popular,
      image_url: m.image_url,
    }))
  );

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const currentProps = propsRef.current;
      switch (data.type) {
        case "regionChange":
          ignoreRegionSyncRef.current = true;
          currentProps.onRegionChangeComplete?.(data.region);
          break;
        case "markerPress":
          currentProps.markers?.find((m) => m.id === data.id)?.onPress?.();
          break;
      }
    } catch {}
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (r: Region, duration?: number) => {
        animatingRef.current = true;
        const dur = (duration ?? 300) / 1000;
        const zoom = deltaToZoom(r.latitudeDelta);
        webViewRef.current?.injectJavaScript(`
          if(window.__map) window.__map.flyTo([${r.latitude},${r.longitude}],${zoom},{duration:${dur}});
          true;
        `);
        setTimeout(() => {
          animatingRef.current = false;
        }, (duration ?? 300) + 150);
      },
      setUserLocation: (lat: number, lng: number) => {
        webViewRef.current?.injectJavaScript(`
          if(window.setUserLocation) window.setUserLocation(${lat},${lng});
          true;
        `);
      },
      setUserLocationEnabled: (enabled: boolean) => {
        webViewRef.current?.injectJavaScript(`
          if(window.setUserLocationEnabled) window.setUserLocationEnabled(${enabled});
          true;
        `);
      },
    }),
    []
  );

  useEffect(() => {
    const safe = (props.markers ?? []).map((m) => ({
      id: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      title: m.title,
      selected: m.selected,
      popular: m.popular,
      image_url: m.image_url,
    }));
    webViewRef.current?.injectJavaScript(`
      if(window.updateMarkers) window.updateMarkers(${JSON.stringify(safe)});
      true;
    `);
  }, [props.markers]);

  useEffect(() => {
    if (ignoreRegionSyncRef.current) {
      ignoreRegionSyncRef.current = false;
      return;
    }
    if (animatingRef.current) return;
    const r = props.region;
    if (!r) return;
    const zoom = deltaToZoom(r.latitudeDelta);
    webViewRef.current?.injectJavaScript(`
      if(window.__map) window.__map.setView([${r.latitude},${r.longitude}],${zoom});
      true;
    `);
  }, [props.region?.latitude, props.region?.longitude, props.region?.latitudeDelta, props.region?.longitudeDelta]);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`
      if(window.setUserLocationEnabled) window.setUserLocationEnabled(${!!props.showsUserLocation});
      true;
    `);
  }, [props.showsUserLocation]);

  const html = useMemo(
    () => buildMapHtml(initRegion.current, initMarkers.current),
    []
  );

  return (
    <View style={props.style}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        originWhitelist={["*"]}
        onMessage={handleMessage}
      />
    </View>
  );
});

export default MapView;