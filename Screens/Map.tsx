import React, { FC, useState, useMemo } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView, { UrlTile, Region, MapTypes, Marker } from "react-native-maps"; // Import Marker component
import * as FileSystem from "expo-file-system";
import { Button } from "react-native-elements";
import { AppConstants } from "../constants";
import { DownloadSettings } from "./DownloadSettings";
import Constants from "expo-constants";

interface MapProps {
  latitude: number;
  longitude: number;
}

const INITIALREGION: Region = {
  latitude: 9.510193665049792,
  longitude: 76.51247231749345,
  latitudeDelta: 1,
  longitudeDelta: 1,
};

const MAP_TYPE: MapTypes = Platform.OS == "android" ? "standard" : "standard";

export const Map: FC = ({ route }) => {
  const [isOffline, setIsOffline] = useState(true);
  const [visisbleSettings, setVisisbleSettings] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIALREGION);

  const { latitude, longitude } = route.params;

  // const latitude = 9.510168311337052;
  // const longitude = 76.55126283586765; // Fake longitude data

  const urlTemplate = useMemo(
    () =>
      isOffline
        ? `${AppConstants.TILE_FOLDER}/{z}/{x}/{y}.png`
        : `${AppConstants.MAP_URL}/{z}/{x}/{y}.png`,
    [isOffline]
  );

  async function clearTiles() {
    try {
      await FileSystem.deleteAsync(AppConstants.TILE_FOLDER);
      alert("Deleted all tiles");
    } catch (error) {
      console.warn(error);
    }
  }

  function toggleOffline() {
    setIsOffline(!isOffline);
  }

  function toggeleDownloadSettings() {
    setVisisbleSettings(!visisbleSettings);
  }

  function onDownloadComplete() {
    setIsOffline(true);
    setVisisbleSettings(false);
  }

  const toggleOfflineText = isOffline ? "Go online" : "Go offline";

  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1 }}
        mapType={MAP_TYPE}
        initialRegion={INITIALREGION}
        onRegionChange={setMapRegion}
      >
        <UrlTile urlTemplate={urlTemplate} zIndex={1} />
        {/* Add Marker component with desired coordinates */}
        <Marker
          coordinate={{
            latitude: latitude,
            longitude: longitude,
          }}
          title="Your Marker Title"
          description="Your Marker Description"
        />
      </MapView>
      {/* 
      <View style={styles.actionContainer}>
        <Button raised title={"Download"} onPress={toggeleDownloadSettings} />
        <Button raised title={"Clear tiles"} onPress={clearTiles} />
        <Button raised title={toggleOfflineText} onPress={toggleOffline} />
      </View> */}

      {visisbleSettings && (
        <DownloadSettings mapRegion={mapRegion} onFinish={onDownloadComplete} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 15,
    paddingTop: Constants.statusBarHeight + 15,
    zIndex: 999,
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: "white",
    borderRadius: 10,
  },
  container: {
    flex: 1,
  },
});
