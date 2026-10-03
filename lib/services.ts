export type Service = {
  slug: string;
  href: string;
  title: string;
  blurb: string;
  image: string;
  live: boolean;
  // Used by the "coming soon" pages
  description?: string;
  expect?: string[];
};

// Edit this one file to change the home page grid, the nav dropdown and the coming-soon pages.
export const services: Service[] = [
  {
    slug: "photobooth", href: "/photobooth", title: "Photo Booth", live: true,
    blurb: "Our timber photobooth with instant prints and keepsakes for weddings, parties and brand events.",
    image: "/timberbooth_1.png",
  },
  {
    slug: "graduation", href: "/graduation", title: "Graduation Photography", live: true,
    blurb: "Pick your photographer from their real work, choose a time and book on convocation day.",
    image: "/events/university.jpg",
  },
  {
    slug: "event-photography", href: "/event-photography", title: "Event Photography", live: false,
    blurb: "Professional coverage for corporate events, launches and celebrations.",
    image: "/events/birthday.jpg",
    description: "Dedicated photographers who capture the people, the details and the energy of your event, then deliver edited photos in an online gallery.",
    expect: ["Full-event or half-day coverage", "Edited photos in an online gallery", "Fast turnaround for social media", "Optional same-day highlights"],
  },
  {
    slug: "wedding-photography", href: "/wedding-photography", title: "Wedding Photography", live: false,
    blurb: "Timeless wedding stories, from the preparations to the last dance.",
    image: "/events/wedding.jpg",
    description: "Wedding photography with a natural, elegant style, planned around your day and paired with our Timberbooth guest keepsakes if you like.",
    expect: ["Pre-wedding and wedding-day packages", "Photographer matched to your style", "Album and print options", "Combine with Timberbooth keepsakes"],
  },
  {
    slug: "guestbook", href: "/guestbook", title: "Audio & Video Guestbook", live: false,
    blurb: "Let guests leave voice and video messages you can replay for years.",
    image: "/events/guestbook.jpg",
    description: "A modern guestbook where guests record short audio or video messages for the couple or host, collected into one keepsake.",
    expect: ["Audio and video message stations", "Messages collected in one private album", "Works for weddings and milestone birthdays", "Download everything after the event"],
  },
  {
    slug: "receipt-photobooth", href: "/receipt-photobooth", title: "Receipt Photo Booth", live: false,
    blurb: "A playful booth that prints your photo on a long receipt-style strip.",
    image: "/events/recipt.jpg",
    description: "A fun, compact booth that prints each guest's photos on a receipt-style paper strip. A talking point at parties and brand activations.",
    expect: ["Compact, easy-to-place setup", "Custom text and branding on the strip", "Instant printing", "Great for brand activations and parties"],
  },
];

export const WHATSAPP = process.env.NEXT_PUBLIC_FOURMEN_WHATSAPP || "94719799448";
export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
