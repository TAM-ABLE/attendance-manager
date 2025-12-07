"use client";

import { motion } from "framer-motion";

export const Loader = ({
    size = 24,
    border = 3,
}: { size?: number; border?: number }) => (
    <motion.div
        className="rounded-full border-t-transparent border-black"
        style={{ width: size, height: size, borderWidth: border }}
        animate={{ rotate: 360 }}
        transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 0.8,
        }}
    />
);
