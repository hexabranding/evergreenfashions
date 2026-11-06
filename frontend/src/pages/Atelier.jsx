import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dress4 from "@/assets/dress-4.png";

export default function Atelier() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-blush/40 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-crimson/10 blur-[160px]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-8 relative z-10 py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-foreground/60" />
              Since 1957 · Paris
            </p>
            <h1 className="text-display text-6xl md:text-8xl max-w-4xl">
              Where craft
              <br />
              becomes <em className="text-crimson">art.</em>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-[1600px] mx-auto px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-[4/5] bg-secondary overflow-hidden"
          >
            <motion.img
              src={dress4}
              alt="Hand-stitching process in the Parisian atelier"
              width={768}
              height={1024}
              loading="lazy"
              className="w-full h-full object-contain animate-float"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <p className="eyebrow mb-6">— The Process</p>
            <h2 className="text-display text-5xl md:text-6xl mb-8">
              Sixty-eight hours of{" "}
              <em className="text-crimson">hand-stitching.</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              Every Maison piece begins as a single length of raw silk. Our
              première main drapes it directly onto the form — no pattern, no
              shortcut — until the fabric decides how it wants to fall.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
              The result is clothing that moves like a second breath. Wearable
              architecture, alive to every step.
            </p>
            <div className="flex flex-wrap gap-x-14 gap-y-6 pt-8 border-t border-border/70 max-w-2xl">
              {[
                ["48", "Ateliers · FR"],
                ["1957", "Since"],
                ["100%", "Handcrafted"],
                ["★", "Est. Paris"],
              ].map(([n, l]) => (
                <div key={l} className="text-left">
                  <div className="text-2xl font-serif leading-none">{n}</div>
                  <div className="eyebrow mt-2">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-cream py-32">
        <div className="max-w-[1600px] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="eyebrow mb-6">— Philosophy</p>
            <h2 className="text-display text-5xl md:text-6xl mb-8">
              A quiet revolt against the{" "}
              <em className="text-crimson">disposable.</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We don't follow seasons. We follow fabric. Each bolt of silk is
              selected for its hand, its drape, the way it catches light at
              golden hour. Our atelier produces forty-eight pieces per
              collection — no more.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              This is not fashion as performance. It is fashion as breath.
              Movement. A conversation between cloth and body that has been
              ongoing since 1957.
            </p>
            <a href="#" className="btn-ink btn-ink-hover">
              Visit the Atelier <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="eyebrow mb-6">— Appointments</p>
          <h2 className="text-display text-5xl md:text-6xl mb-6">
            Book a <em className="text-crimson">private viewing.</em>
          </h2>
          <p className="text-muted-foreground mb-10">
            Visit our atelier for a one-on-one consultation with our design
            team. By appointment only.
          </p>
          <button className="btn-ink btn-ink-hover">
            Request Appointment <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>
    </>
  );
}
