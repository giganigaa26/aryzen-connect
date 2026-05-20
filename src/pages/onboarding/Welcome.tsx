import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import { APP_CONFIG } from "@/lib/config";

/**
 * Welcome screen — first impression. Big dynamic logo, tagline, two CTAs.
 *
 * Background: subtle radial gradient using semantic primary token. No heavy
 * particle libraries (keeps APK bundle slim) — pure CSS gradient.
 */
export default function Welcome() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 safe-top safe-bottom bg-background relative overflow-hidden">
      {/* Animated brand glow background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 20%, hsl(var(--primary) / 0.18), transparent 70%), radial-gradient(40% 30% at 50% 80%, hsl(var(--accent) / 0.12), transparent 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full -z-10"
        style={{ background: "hsl(var(--primary) / 0.10)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AppLogo size={112} rounded="rounded-3xl" />
        </motion.div>
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">{APP_CONFIG.name}</h1>
          <p className="text-lg text-muted-foreground font-medium">{APP_CONFIG.tagline}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full space-y-3"
      >
        <Button size="xl" onClick={() => nav("/language")}>
          Get Started
        </Button>
        <Button
          size="xl"
          variant="outline"
          onClick={() => nav("/auth")}
        >
          I Have an Account
        </Button>
        <p className="text-center text-[11px] text-muted-foreground pt-1">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
