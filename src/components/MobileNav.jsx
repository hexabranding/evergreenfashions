import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";

const menuItems = [
  { number: "01", label: "Men", path: "/collection" },
  { number: "02", label: "Women", path: "/collection" },
  { number: "03", label: "Rental", path: "/collection" },
  { number: "04", label: "Footwear", path: "/collection" },
  { number: "05", label: "Suits", path: "/collection" },
  { number: "06", label: "Accessories", path: "/collection" },
];

const bottomLinks = [
  { label: "New Arrivals", path: "/collection" },
  { label: "Atelier", path: "/atelier" },
  { label: "Journal", path: "/journal" },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1, duration: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

const bottomVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 },
  },
};

export default function MobileNav({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col overflow-hidden"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Background with cream base */}
          <div className="absolute inset-0 bg-[#FAF7F2]" />

          {/* Ambient blur accents */}
          <div className="pointer-events-none absolute top-[-15%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-blush/40 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-[50vh] w-[50vh] rounded-full bg-crimson/15 blur-[140px]" />
          <div className="pointer-events-none absolute top-[40%] left-[50%] h-[30vh] w-[30vh] -translate-x-1/2 rounded-full bg-blush/20 blur-[100px]" />

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-5 right-6 z-50 flex h-12 w-12 items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-[5px]">
              <span className="block h-[1.5px] w-6 rotate-45 bg-foreground" />
              <span className="block h-[1.5px] w-6 -rotate-45 bg-foreground" />
            </div>
          </motion.button>

          {/* Content */}
          <div className="relative flex flex-1 flex-col justify-between px-8 py-20 sm:px-12">
            {/* Main navigation */}
            <motion.nav
              className="flex flex-1 flex-col justify-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {menuItems.map((item) => (
                <motion.div key={item.label} variants={itemVariants}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className="group flex items-baseline gap-3 py-3 sm:gap-4 sm:py-4"
                  >
                    <span className="font-serif text-[clamp(0.65rem,1.5vw,0.85rem)] text-muted-foreground/50 transition-colors group-hover:text-crimson">
                      {item.number}
                    </span>
                    <span className="font-serif text-[clamp(1.5rem,5vw,2.5rem)] leading-none tracking-[-0.02em] text-foreground transition-colors group-hover:text-crimson">
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Secondary links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 flex gap-6 border-t border-foreground/10 pt-6"
            >
              {bottomLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={onClose}
                  className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground/50 transition-colors hover:text-crimson"
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>

            {/* Bottom section */}
            <motion.div
              variants={bottomVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="mt-auto border-t border-foreground/10 pt-8"
            >
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                {/* Client Care */}
                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">
                    Client Care
                  </span>
                  <a
                    href="mailto:bonjour@evergreenfashion.com"
                    className="flex items-center gap-2 font-serif text-sm text-foreground/70 transition-colors hover:text-crimson"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    bonjour@evergreenfashion.com
                  </a>
                  <p className="font-serif text-sm text-foreground/70">
                    8 Place Vendôme, Paris
                  </p>
                </div>

                {/* Social links */}
                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">
                    Follow Us
                  </span>
                  <div className="flex gap-5">
                    {[
                      { label: "Instagram", href: "#" },
                      { label: "Pinterest", href: "#" },
                      { label: "TikTok", href: "#" },
                    ].map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        className="font-serif text-sm text-foreground/70 transition-colors hover:text-crimson"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Brand mark */}
                <div className="hidden sm:block">
                  <span className="font-serif text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/40">
                    Paris · Milano · Tokyo
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
