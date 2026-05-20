import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { APP_CONFIG } from "@/lib/config";

export default function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav("/welcome", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3"
      >
        <AppLogo size={88} rounded="rounded-3xl" />
        <h1 className="text-4xl font-extrabold tracking-tight">{APP_CONFIG.name}</h1>
      </motion.div>
    </div>
  );
}
