"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Phone,
  Star,
} from "lucide-react";

const heroImages = [
  "/hero/hero-1.jpg",
  "/hero/hero-2.jpg",
  "/hero/hero-3.jpg",
  "/hero/hero-4.jpg",
  "/hero/hero-5.jpg",
];

const packageGroups = [
  {
    bundle: "Digital Keepsake Bundle",
    description: "Soft copy only package",
    packages: [
      {
        name: "Digital Essence",
        bestFor: "Soft copy only",
        badges: ["✨ Best Value"],
        features: [
          "Unlimited soft copies",
          "Timberbooth setup",
          "Professional booth operator",
          "Best for simple digital memories",
        ],
      },
    ],
  },
  {
    bundle: "Print Experience Bundle",
    description: "Soft copies + unlimited prints without frames",
    packages: [
      {
        name: "Signature 4R",
        bestFor: "4 x 6 inch prints",
        badges: ["🔥 Most Popular", "⭐ Guest Favourite"],
        featured: true,
        features: [
          "Unlimited soft copies",
          "Unlimited 4 x 6 inch prints",
          "Custom event frame design",
          "Premium guest experience",
        ],
      },
      {
        name: "Signature Grande",
        bestFor: "6 x 8 inch prints",
        badges: ["✨ Premium Prints"],
        features: [
          "Unlimited soft copies",
          "Unlimited 6 x 8 inch prints",
          "Custom event frame design",
          "Premium large-size prints",
        ],
      },
    ],
  },
  {
    bundle: "Framed Memories Bundle",
    description: "Soft copies + prints + premium photo frames",
    packages: [
      {
        name: "Keepsake 4R",
        bestFor: "4 x 6 prints with frames",
        badges: ["🎁 Best for Events"],
        features: [
          "Unlimited soft copies",
          "Unlimited 4 x 6 inch prints",
          "100 photo frames included",
          "Additional frames: LKR 450 each",
        ],
      },
      {
        name: "Keepsake Grande",
        bestFor: "6 x 8 prints with frames",
        badges: ["👑 Premium Choice", "🔥 Luxury Bundle"],
        featured: true,
        features: [
          "Unlimited soft copies",
          "Unlimited 6 x 8 inch prints",
          "100 photo frames included",
          "Additional frames: LKR 800 each",
        ],
      },
    ],
  },
  {
    bundle: "Wedding Guest Keepsake Collection",
    description:
      "Thoughtfully curated wedding gifts designed to replace traditional wedding cake or brownie giveaways with lasting memories.",
    packages: [
      {
        name: "Memory Key Tag",
        featured: true,
        badges: ["NEW", "Best Seller"],
        image: "/packages/keytag.png",
        description:
          "A personalized keepsake your guests can carry everywhere.",
        features: [
          "Personalized acrylic key tag",
          "Guest photo + Couple photo",
          '2" × 6" Premium Photo Strip',
          "Luxury gift presentation",
        ],
      },
      {
        name: "Magnetic Photo Container",
        badges: ["Premium"],
        image: "/packages/magnetic.png",
        description: "An elegant magnetic photo keepsake for every guest.",
        features: [
          "Magnetic photo container",
          "Premium printed photo",
          '2" × 6" Premium Photo Strip',
          "Luxury hardboard presentation box",
        ],
      },
      {
        name: "Framed Photo Keepsake",
        badges: ["Elegant"],
        image: "/packages/frame.png",
        description: "A timeless printed memory beautifully presented.",
        features: [
          '4" × 6" Premium Print',
          "Elegant paper photo frame",
          '2" × 6" Premium Photo Strip',
          "Ready for gifting",
        ],
      },
      {
        name: "Custom Wedding Gift Box",
        featured: true,
        badges: ["Signature Collection"],
        image: "/packages/giftbox.png",
        description: "Create your own personalized guest appreciation gift.",
        features: [
          "Choice of keepsake products",
          "Luxury gift box",
          "Personalized thank-you card",
          "Fully customizable contents",
        ],
      },
    ],
  },
];

const eventTypes = [
  {
    title: "Wedding Celebrations",
    description: "Elegant guest memories for luxury wedding moments.",
    image: "/events/wedding.jpg",
  },
  {
    title: "Corporate Events",
    description: "Branded photo experiences for teams and clients.",
    image: "/events/corporate.jpg",
  },
  {
    title: "University Events",
    description: "Fun, fast, and memorable student event captures.",
    image: "/events/university.jpg",
  },
  {
    title: "Birthday Parties",
    description: "Printed keepsakes for personal celebrations.",
    image: "/events/birthday.jpg",
  },
  {
    title: "Awrudu Events",
    description: "Festive memories with family, friends, and culture.",
    image: "/events/awrudu.jpg",
  },
  {
    title: "Brand Activations",
    description: "Interactive booth experiences for launches and promotions.",
    image: "/events/brand.jpg",
  },
];

export default function FourmenEventsHome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState("Signature 4R");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await emailjs.send(
        "service_pbooxmb",
        "template_n12v4x5",
        {
          from_name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message,
        },
        "wTVlo3FSVq6-oci40",
      );

      setSuccess(true);

      setFormData({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.log(error);
      alert("Failed to send booking request");
    }

    setLoading(false);
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setActiveSlide(
      (current) => (current - 1 + heroImages.length) % heroImages.length,
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-black">
      <section className="relative min-h-[100svh] overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === activeSlide
                ? "scale-100 opacity-100"
                : "scale-105 opacity-0"
            }`}
          >
            <NextImage
              src={image}
              alt={`Fourmen Events hero ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 md:bg-gradient-to-r md:from-black/75 md:via-black/25 md:to-transparent" />

        <nav className="absolute left-0 right-0 top-0 z-30 px-5 py-5 md:px-12 md:py-6">
          <div className="relative mx-auto flex max-w-[1500px] items-center justify-between">
            <div className="flex w-[120px] items-center md:w-[220px]">
              <div className="relative h-14 w-28 overflow-visible md:h-20 md:w-40">
                <NextImage
                  src="/fourmen-logo.png"
                  alt="Fourmen Events Logo"
                  fill
                  priority
                  className="object-contain object-left scale-[1] brightness-0 invert md:scale-[1.2]"
                />
              </div>
            </div>

            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-xs font-medium uppercase tracking-[0.35em] text-white/80 lg:flex">
              {[
                ["Home", "#"],
                ["Timberbooth", "#timberbooth"],
                ["Packages", "#packages"],
                ["Events", "#events"],
                ["Contact", "#booking"],
              ].map(([item, href]) => (
                <a
                  key={item}
                  href={href}
                  className="transition hover:text-white hover:tracking-[0.45em]"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex w-[120px] justify-end md:w-[220px]">
              <a
                href="#booking"
                className="border border-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-white hover:text-black md:px-7 md:text-xs"
              >
                Book Now
              </a>
            </div>
          </div>
        </nav>

        <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-[1500px] items-center px-5 pt-24 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-white/70 md:text-xs md:tracking-[0.45em]">
              Fourmen Events Timberbooth Experience
            </p>

            <h1 className="text-4xl font-light uppercase leading-[1.12] tracking-[0.12em] sm:text-5xl md:text-7xl md:tracking-[0.16em]">
              Make every event unforgettable.
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/75 md:mt-8 md:text-base md:leading-8">
              Premium photobooth experiences for weddings, corporate events,
              birthdays, university events, and celebrations across Sri Lanka.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
              <a
                href="#packages"
                className="bg-white px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition duration-300 hover:-translate-y-1 hover:bg-[#9b5b2b] hover:text-white md:px-8 md:text-xs"
              >
                View Packages
              </a>

              <a
                href="#booking"
                className="border border-white px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-black md:px-8 md:text-xs"
              >
                Book Timberbooth
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 right-5 z-30 flex gap-3 md:bottom-10 md:right-10">
          <button
            onClick={prevSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-white backdrop-blur-md transition hover:bg-white hover:text-black md:h-12 md:w-12"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-white backdrop-blur-md transition hover:bg-white hover:text-black md:h-12 md:w-12"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:bottom-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeSlide ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      <section
        id="timberbooth"
        className="relative overflow-hidden bg-white px-5 py-20 md:px-12 md:py-24 lg:px-16"
      >
        <div className="relative z-20 mx-auto grid max-w-[1500px] items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, y: 45 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-black/55 md:text-xs md:tracking-[0.45em]">
              Sri Lanka’s elegant timber photobooth experience
            </p>

            <h2 className="max-w-3xl text-4xl font-light uppercase leading-[1.12] tracking-[0.12em] sm:text-5xl md:text-6xl md:tracking-[0.16em] lg:text-[72px]">
              Photo booth design, reimagined.
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-black/60 md:mt-8 md:text-base md:leading-8">
              Fourmen Events brings a refined Timberbooth photobooth experience
              for weddings, corporate events, parties, university events, and
              premium celebrations.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
              <a
                href="#packages"
                className="bg-black px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-1 hover:bg-[#9b5b2b] md:px-8 md:text-xs"
              >
                View Packages
              </a>

              <a
                href="#booking"
                className="border border-black px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:-translate-y-1 hover:bg-black hover:text-white md:px-8 md:text-xs"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative h-[240px] w-full transition duration-500 hover:scale-[1.03] sm:h-[460px] md:h-[560px] lg:h-[640px]"
          >
            <NextImage
              src="/timberbooth_1.png"
              alt="Fourmen Events Timberbooth"
              fill
              priority
              className="object-contain object-bottom"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-30 mx-auto mt-12 grid max-w-[1500px] gap-6 border-y border-black/10 py-7 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            ["Premium Quality", "High-end equipment"],
            ["Instant Prints", "High-speed printing"],
            ["Memorable Moments", "Unforgettable experiences"],
            ["Reliable Service", "Professional support"],
          ].map(([title, desc]) => (
            <div key={title} className="group flex items-center gap-4">
              <Star
                className="shrink-0 text-[#9b5b2b] transition group-hover:scale-125"
                size={26}
              />
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.12em]">
                  {title}
                </p>
                <p className="mt-1 text-sm text-black/50">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      <section
        id="packages"
        className="bg-[#f3eee7] px-5 py-20 md:px-12 md:py-28 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-center text-[10px] uppercase tracking-[0.4em] text-black/50 md:text-xs">
              Packages
            </p>

            <h2 className="mt-5 text-center text-3xl font-light uppercase tracking-[0.16em] sm:text-4xl md:text-5xl md:tracking-[0.22em]">
              Choose your event experience.
            </h2>
          </motion.div>

          <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
            {packageGroups.map((group, groupIndex) => (
              <motion.div
                key={group.bundle}
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: groupIndex * 0.1 }}
              >
                <div className="mb-7 text-center">
                  <h3 className="text-xl font-light uppercase tracking-[0.18em] md:text-2xl md:tracking-[0.22em]">
                    {group.bundle}
                  </h3>
                  <p className="mt-3 text-sm text-black/50">
                    {group.description}
                  </p>
                </div>

                <div
                  className={`mx-auto grid gap-6 md:gap-7 ${
                    group.packages.length === 1
                      ? "max-w-md grid-cols-1"
                      : "max-w-4xl md:grid-cols-2"
                  }`}
                >
                  {group.packages.map((pkg, index) => (
                    <motion.button
                      key={pkg.name}
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      onClick={() => setSelectedPackage(pkg.name)}
                      className={`group relative overflow-hidden border text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                        pkg.featured
                          ? "border-[#5c3b24] bg-[#1c120c] text-white shadow-xl shadow-[#1c120c]/20"
                          : "border-[#dbcfc1] bg-[#f8f4ef] text-black hover:border-[#9b5b2b] hover:shadow-[#9b5b2b]/10"
                      } ${selectedPackage === pkg.name ? "scale-[1.01]" : ""}`}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(120,72,32,0.35) 3px, transparent 4px)",
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-br from-[#c89a68]/10 via-transparent to-transparent" />

                      <div className="relative z-10 p-6 md:p-8">
                        <p
                          className={`text-[10px] uppercase tracking-[0.28em] md:text-[11px] md:tracking-[0.35em] ${
                            pkg.featured ? "text-[#e2b27c]" : "text-[#9b5b2b]"
                          }`}
                        >
                          Timberbooth Package
                        </p>

                        {pkg.badges && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {pkg.badges.map((badge) => (
                              <div
                                key={badge}
                                className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.14em] md:px-4 md:text-[10px] ${
                                  pkg.featured
                                    ? "bg-[#f0c58f]/15 text-[#f0c58f]"
                                    : "bg-[#9b5b2b]/10 text-[#9b5b2b]"
                                }`}
                              >
                                {badge}
                              </div>
                            ))}
                          </div>
                        )}

                        <h3 className="mt-5 text-2xl font-light uppercase leading-tight tracking-[0.1em] md:text-3xl md:tracking-[0.12em]">
                          {pkg.name}
                        </h3>

                        <p
                          className={`mt-3 text-sm ${
                            pkg.featured ? "text-white/55" : "text-black/45"
                          }`}
                        ></p>

                        <div className="mt-7 h-px w-full bg-gradient-to-r from-[#9b5b2b]/40 to-transparent md:mt-8" />

                        <p
                          className={`mt-7 text-2xl font-light tracking-[0.08em] md:mt-8 md:text-3xl ${
                            pkg.featured ? "text-[#f0c58f]" : "text-[#9b5b2b]"
                          }`}
                        ></p>

                        <div className="mt-7 space-y-4 md:mt-8 md:space-y-5">
                          {pkg.features.map((feature) => (
                            <div
                              key={feature}
                              className={`flex gap-3 text-sm leading-7 md:text-[15px] ${
                                pkg.featured ? "text-white/75" : "text-black/65"
                              }`}
                            >
                              <CheckCircle2
                                size={17}
                                className={`mt-1 shrink-0 ${
                                  pkg.featured
                                    ? "text-[#d6a06a]"
                                    : "text-[#9b5b2b]"
                                }`}
                              />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="events"
        className="bg-white px-5 py-20 md:px-12 md:py-28 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-center text-3xl font-extralight uppercase tracking-[0.18em] sm:text-4xl md:text-6xl md:tracking-[0.22em]">
              Moments We Create
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-7 text-black/55 md:mt-6 md:text-base md:leading-8">
              From intimate celebrations to large-scale brand experiences, our
              Timberbooth is designed to turn every guest interaction into a
              lasting memory.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative min-h-[300px] overflow-hidden sm:min-h-[330px] md:min-h-[340px]"
              >
                <NextImage
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-black/50 transition duration-500 group-hover:bg-black/35" />

                <div className="absolute right-5 top-5 text-5xl font-extralight tracking-[-0.08em] text-white/20 md:right-6 md:top-6 md:text-6xl">
                  0{index + 1}
                </div>

                <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-7">
                  <Camera
                    className="text-[#d6a06a] transition group-hover:scale-125"
                    size={24}
                  />

                  <div>
                    <h3 className="text-2xl font-light uppercase tracking-[0.12em] text-white transition group-hover:tracking-[0.16em] md:text-3xl md:tracking-[0.14em]">
                      {item.title}
                    </h3>

                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="booking"
        className="bg-white px-5 py-20 md:px-12 md:py-28 lg:px-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto grid max-w-7xl gap-6 border border-black/10 bg-[#f8f5f1] p-5 md:p-12 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="bg-white p-6 transition hover:shadow-xl md:p-8">
            <CalendarCheck className="text-[#9b5b2b]" size={36} />
            <h2 className="mt-7 text-3xl font-light uppercase tracking-[0.1em] md:mt-8 md:text-4xl md:tracking-[0.12em]">
              Book Timberbooth for your next event.
            </h2>
            <p className="mt-5 text-sm leading-7 text-black/60 md:mt-6 md:text-base md:leading-8">
              Let your guests take home a printed memory while your event gets a
              premium experience touch.
            </p>

            <div className="mt-7 space-y-4 text-sm text-black/70 md:mt-8 md:text-base">
              <p className="flex items-center gap-3">
                <Phone size={18} className="text-[#9b5b2b]" /> +94 71 979 9448
              </p>
              <p className="flex items-center gap-3">
                <Mail size={18} className="text-[#9b5b2b]" />
                fourmen.events26@gmail.com
              </p>
            </div>
          </div>

          <form
            onSubmit={sendEmail}
            className="grid gap-4 bg-white p-6 transition hover:shadow-xl md:p-8"
          >
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border border-black/10 bg-white px-5 py-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#9b5b2b]"
              placeholder="Your name"
              required
            />

            <input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="border border-black/10 bg-white px-5 py-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#9b5b2b]"
              placeholder="Phone number"
              required
            />

            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border border-black/10 bg-white px-5 py-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#9b5b2b]"
              placeholder="Email address"
              required
            />

            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="min-h-32 border border-black/10 bg-white px-5 py-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#9b5b2b]"
              placeholder="Tell us about your event"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-1 hover:bg-[#9b5b2b] md:text-xs md:tracking-[0.3em]"
            >
              {loading ? "Sending..." : "Send Booking Request"}
            </button>

            {success && (
              <p className="text-sm text-green-600">
                Booking request sent successfully.
              </p>
            )}
          </form>
        </motion.div>
      </section>

      <footer className="border-t border-black/10 bg-white px-5 py-10 text-center text-[10px] uppercase tracking-[0.22em] text-black/45 md:text-xs md:tracking-[0.3em]">
        © 2026 Fourmen Events. Crafted for premium memories.
      </footer>
    </main>
  );
}
