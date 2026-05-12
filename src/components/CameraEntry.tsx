import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X } from "lucide-react-native";
import { useOCR } from "../services/OCRService";
import { LedgerEngine } from "../services/LedgerEngine";
import { useLedgerStore } from "../store/useLedgerStore";

export const CameraEntry = ({ onClose }: { onClose: () => void }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [status, setStatus] = useState<
    "idle" | "capturing" | "processing" | "done"
  >("idle");

  const { processReceipt } = useOCR();
  const refreshLedger = useLedgerStore((state) => state.refresh);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setStatus("capturing");
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) throw new Error("Failed to take photo");

      setStatus("processing");
      const structured = await processReceipt(photo.uri);

      await LedgerEngine.addEntry("image", structured, `Receipt analysis`);
      refreshLedger();
      setStatus("done");
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color="#FFF" size={32} />
          </TouchableOpacity>

          <View style={styles.frame} />

          <View style={styles.footer}>
            <Text style={styles.hint}>Align receipt within the frame</Text>
            {status === "processing" || status === "capturing" ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : (
              <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 60,
  },
  closeBtn: { alignSelf: "flex-end" },
  frame: {
    width: "80%",
    height: "50%",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignSelf: "center",
    borderRadius: 20,
  },
  footer: { alignItems: "center", marginBottom: 40 },
  hint: { color: "#FFF", fontSize: 14, fontWeight: "600", marginBottom: 24 },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
  },
  errorText: { color: "#FFF", marginBottom: 20, textAlign: "center" },
  permissionBtn: { backgroundColor: "#3B82F6", padding: 12, borderRadius: 8 },
  permissionBtnText: { color: "#FFF", fontWeight: "700" },
});
