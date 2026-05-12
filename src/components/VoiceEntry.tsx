import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Mic, X, Check, AlertCircle } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { SpeechService } from "../services/SpeechService";
import { useGemmaService } from "../services/GemmaService";
import { LedgerEngine } from "../services/LedgerEngine";
import { useLedgerStore } from "../store/useLedgerStore";

export const VoiceEntry = ({ onClose }: { onClose: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<
    "idle" | "recording" | "processing" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  const { extractLedgerEntry, isReady } = useGemmaService();
  const refreshLedger = useLedgerStore((state) => state.refresh);

  const startRecording = async () => {
    try {
      setStatus("recording");
      setIsRecording(true);
      setTranscript("");

      await SpeechService.startSpeechRecognition(
        (text) => {
          setTranscript(text);
          if (text) processTranscript(text);
        },
        (err) => {
          setError("Speech recognition failed");
          setStatus("error");
        },
      );
    } catch (e) {
      setError("Could not start microphone");
      setStatus("error");
    }
  };

  const processTranscript = async (text: string) => {
    setStatus("processing");
    try {
      const structured = await extractLedgerEntry(text);
      await LedgerEngine.addEntry("voice", structured, text);
      setStatus("success");
      refreshLedger();
      setTimeout(onClose, 2000);
    } catch (e) {
      setError("Failed to understand transaction");
      setStatus("error");
    }
  };

  return (
    <View style={styles.overlay}>
      <MotiView
        from={{ translateY: 300 }}
        animate={{ translateY: 0 }}
        style={styles.sheet}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Voice Entry</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#64748B" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <AnimatePresence>
            {status === "recording" && (
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                style={styles.visualizer}
              >
                <View style={styles.ring1} />
                <View style={styles.ring2} />
              </MotiView>
            )}
          </AnimatePresence>

          <View style={styles.statusIcon}>
            {status === "idle" && <Mic size={48} color="#94A3B8" />}
            {status === "recording" && <Mic size={48} color="#8B5CF6" />}
            {status === "processing" && (
              <ActivityIndicator size="large" color="#8B5CF6" />
            )}
            {status === "success" && <Check size={48} color="#10B981" />}
            {status === "error" && <AlertCircle size={48} color="#EF4444" />}
          </View>

          <Text style={styles.statusText}>
            {!isReady && "Waking up Ledger..."}
            {isReady && status === "idle" && "Tap to start speaking"}
            {status === "recording" && "Listening..."}
            {status === "processing" && "Analyzing..."}
            {status === "success" && "Transaction added!"}
            {status === "error" && error}
          </Text>

          {transcript ? (
            <Text style={styles.transcript}>"{transcript}"</Text>
          ) : null}

          {status === "idle" && (
            <TouchableOpacity
              style={[styles.micBtn, !isReady && styles.disabledBtn]}
              onPress={startRecording}
              disabled={!isReady}
            >
              <Mic color="#FFF" size={32} />
            </TouchableOpacity>
          )}

          {status === "error" && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => setStatus("idle")}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  content: {
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
  transcript: {
    fontSize: 16,
    color: "#64748B",
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledBtn: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  retryBtn: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  retryText: {
    color: "#475569",
    fontWeight: "700",
  },
  visualizer: {
    position: "absolute",
    top: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  ring1: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  ring2: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.1)",
    position: "absolute",
  },
});
