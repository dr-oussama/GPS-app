import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useState, useRef, useEffect } from "react";
import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
import * as Location from "expo-location";

export default function App() {
  const [facing, setFacing] = useState("back");
  const [loca, setLoca] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false); // New state variable
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [mediaPermissionsStatus, requestMediaPermission] =
    MediaLibrary.usePermissions();

  useEffect(() => {
    if (!mediaPermissionsStatus || !mediaPermissionsStatus.granted) {
      requestMediaPermission();
    }
  }, [mediaPermissionsStatus]);

  useEffect(() => {
    (async () => {
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      getLocationPermission();
      setHasCameraPermission(status === "granted");
      setIsCameraEnabled(status === "granted");
    })();

    // Clean up camera resources when component is unmounted
    return () => {
      setIsCameraEnabled(false); // Disable camera
    };
  }, []);

  const getLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return;
    }
  };

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }
  const takePicture = async () => {
    Location.getCurrentPositionAsync({}).then((location) => {
      setLoca(location);
    });
    if (cameraRef.current && isCameraEnabled) {
      // Check if camera is enabled
      let photo = await cameraRef.current.takePictureAsync({
        exif: true,
        additionalExif: {
          location: loca,
          test: "hello world",
        },
        onPictureSaved(picture) {
          console.log(picture);
          setCapturedPhoto(picture.uri);
          savePhoto(picture.uri);

          if (picture.exif) {
            const { GPSLatitude, GPSLongitude } = picture.exif;
            if (GPSLatitude && GPSLongitude) {
              console.log(
                `Latitude: ${GPSLatitude}, Longitude: ${GPSLongitude}`
              );
            }
          }
        },
      });
    }
  };

  const savePhoto = async (uri: string) => {
    if (mediaPermissionsStatus?.status === "granted") {
      await MediaLibrary.saveToLibraryAsync(uri);
    } else {
      console.log("Permission denied to save photo to device");
    }
  };
  const Geolocation = async () => {
    // open map with location from captured photo stored in loca state variable
    if (loca) {
      const { latitude, longitude } = loca.coords;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      // open map in browser with location
      window.open(url, "_blank");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isCameraEnabled && ( // Render CameraView only if camera is enabled
        <CameraView style={{ flex: 1 }} ref={cameraRef}>
          <View
            style={{
              flex: 1,
              backgroundColor: "transparent",
              flexDirection: "row",
              justifyContent: "space-between",
              margin: 20,
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}>

            <Button title="Take Picture" onPress={takePicture} color="red" />
          </View>
        </CameraView>
      )}
      {capturedPhoto && (
        <>
          <Image source={{ uri: capturedPhoto }} style={{ flex: 1 }} />
          <Button onPress={Geolocation} title="See Geolocation" color="red" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
