import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";

interface LegalFooterProps {
  showResearchNote?: boolean;
  compact?: boolean;
}

const LegalFooter: React.FC<LegalFooterProps> = ({
  showResearchNote = false,
  compact = false,
}) => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.warn("Failed to open link:", err),
    );
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {showResearchNote && !compact && (
        <Text style={styles.researchNote}>
          Research concepts referenced are provided for educational purposes.
          LexSee is not affiliated with, endorsed by, or officially connected to
          the authors, institutions, or publications cited.
        </Text>
      )}

      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => openLink("https://lexsee.app/terms")}>
          <Text style={styles.link}>Terms</Text>
        </TouchableOpacity>

        <Text style={styles.separator}>·</Text>

        <TouchableOpacity
          onPress={() => openLink("https://lexsee.app/privacy")}
        >
          <Text style={styles.link}>Privacy</Text>
        </TouchableOpacity>

        <Text style={styles.separator}>·</Text>

        <TouchableOpacity onPress={() => openLink("https://lexsee.app/legal")}>
          <Text style={styles.link}>Legal</Text>
        </TouchableOpacity>

        {!compact && (
          <>
            <Text style={styles.separator}>·</Text>
            <TouchableOpacity
              onPress={() => openLink("mailto:support@lexsee.app")}
            >
              <Text style={styles.link}>Contact</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!compact && (
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} LexSee
        </Text>
      )}
    </View>
  );
};

export default LegalFooter;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  compactContainer: {
    paddingVertical: 16,
  },
  researchNote: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 16,
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  link: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  separator: {
    marginHorizontal: 8,
    color: "rgba(255,255,255,0.4)",
  },
  copyright: {
    fontSize: 12,
    color: "#FF511B",
    marginTop: 12,
    opacity: 0.8,
  },
});
