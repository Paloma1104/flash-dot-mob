/**
 * @file TransactionQRModal.tsx
 * @description Modal to display QR code for transaction signing via WalletConnect
 */

import { BlurView } from "expo-blur";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface TransactionQRModalProps {
  visible: boolean;
  onClose: () => void;
  uri?: string;
  title?: string;
  description?: string;
}

export function TransactionQRModal({
  visible,
  onClose,
  uri,
  title = "Scan with MetaMask",
  description = "Scan this QR code with your MetaMask mobile app to sign the transaction",
}: TransactionQRModalProps) {
  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={uri}
              size={250}
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>📱 How to scan:</Text>
            <Text style={styles.instructionText}>
              1. Open MetaMask mobile app
            </Text>
            <Text style={styles.instructionText}>
              2. Tap the scan icon (camera)
            </Text>
            <Text style={styles.instructionText}>
              3. Point camera at this QR code
            </Text>
            <Text style={styles.instructionText}>
              4. Approve the transaction
            </Text>
          </View>

          {/* Deep Link Option */}
          <Text style={styles.orText}>OR</Text>

          <Pressable style={styles.deepLinkButton} onPress={onClose}>
            <Text style={styles.deepLinkButtonText}>
              Open MetaMask Directly
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(20, 20, 30, 0.98)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#836EF9",
    padding: 24,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
  },
  instructions: {
    width: "100%",
    backgroundColor: "rgba(131, 110, 249, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#836EF9",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginVertical: 4,
    paddingLeft: 8,
  },
  orText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    marginVertical: 12,
  },
  deepLinkButton: {
    width: "100%",
    backgroundColor: "#836EF9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deepLinkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
