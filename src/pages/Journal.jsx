import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    title: "The Architecture of Drape",
    excerpt:
      "How gravity, grain, and the human form conspire to create our signature silhouettes.",
    date: "July 2026",
    category: "Atelier",
  },
  {
    title: "Fabric sourcing in Kyoto",
    excerpt:
      "Our journey through Japan's last remaining silk ateliers — where tradition meets texture.",
    date: "June 2026",
    category: "Travel",
  },
  {
    title: "Why we chose 48 pieces",
    excerpt:
      "The philosophy behind our deliberate restraint — and what it means for conscious design.",
    date: "May 2026",
    category: "Philosophy",
  },
  {
    title: "The hand behind the stitch",
    excerpt:
      "Meet Mathilde, our première main, who has been shaping silk for thirty-two years.",
    date: "April 2026",
    category: "People",
  },
];

export default function Journal() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-[1600px] mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="eyebrow mb-4">— From the Maison</p>
          <h1 className="text-display text-6xl md:text-8xl">
            <em className="text-crimson">Journal</em>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-lg leading-relaxed">
            Dispatches from the atelier — process, philosophy, and the quiet
            details that shape our work.
          </p>
        </motion.div>
      </section>

      {/* Posts */}
      <section className="max-w-[1600px] mx-auto px-8 pb-32">
        <div className="grid md:grid-cols-2 gap-10">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group cursor-pointer border border-border p-8 hover:border-crimson/40 transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="eyebrow">{post.category}</span>
                <span className="w-1 h-1 rounded-full bg-foreground/30" />
                <span className="eyebrow">{post.date}</span>
              </div>
              <h2 className="font-serif text-3xl mb-4 group-hover:text-crimson transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-1 group-hover:text-crimson group-hover:border-crimson transition-colors">
                Read More <ArrowRight className="w-3 h-3" />
              </span>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-cream py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-2xl mx-auto text-center px-8"
        >
          <p className="eyebrow mb-6">— Stay Connected</p>
          <h2 className="text-display text-5xl md:text-6xl mb-6">
            Letters from the <em className="text-crimson">atelier.</em>
          </h2>
          <p className="text-muted-foreground mb-10">
            Private previews, atelier films, and access to pieces before they
            meet the world.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-transparent border-b border-foreground px-2 py-3 text-sm focus:outline-none focus:border-crimson transition-colors"
            />
            <button
              type="submit"
              className="btn-ink btn-ink-hover justify-center"
            >
              Subscribe
            </button>
          </form>
        </motion.div>
      </section>
    </>
  );
}
