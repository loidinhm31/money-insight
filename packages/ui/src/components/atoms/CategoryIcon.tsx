import type { SVGProps, ReactNode } from "react";

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode;

interface IconEntry {
  label: string;
  icon: IconComponent;
}

// Helper to create consistent SVG wrapper
const svg = (children: ReactNode, props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

// --- Icon definitions ---

const Food: IconComponent = (p) =>
  svg(
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </>,
    p,
  );

const Coffee: IconComponent = (p) =>
  svg(
    <>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
    </>,
    p,
  );

const Grocery: IconComponent = (p) =>
  svg(
    <>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>,
    p,
  );

const Transport: IconComponent = (p) =>
  svg(
    <>
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>,
    p,
  );

const Car: IconComponent = (p) =>
  svg(
    <>
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>,
    p,
  );

const Bus: IconComponent = (p) =>
  svg(
    <>
      <path d="M8 6v6" />
      <path d="M15 6v6" />
      <path d="M2 12h19.6" />
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
    </>,
    p,
  );

const Home: IconComponent = (p) =>
  svg(
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>,
    p,
  );

const Electricity: IconComponent = (p) =>
  svg(
    <>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </>,
    p,
  );

const Wifi: IconComponent = (p) =>
  svg(
    <>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </>,
    p,
  );

const Water: IconComponent = (p) =>
  svg(<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />, p);

const Shopping: IconComponent = (p) =>
  svg(
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>,
    p,
  );

const Clothing: IconComponent = (p) =>
  svg(
    <>
      <path d="M20.38 3.46L16 2 12 5 8 2 3.62 3.46a2 2 0 0 0-1.34 1.73l-.58 7.3a1 1 0 0 0 1 1.1h3.3v8.4h14v-8.4h3.3a1 1 0 0 0 1-1.1l-.58-7.3a2 2 0 0 0-1.34-1.73z" />
    </>,
    p,
  );

const Health: IconComponent = (p) =>
  svg(
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </>,
    p,
  );

const Pill: IconComponent = (p) =>
  svg(
    <>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
      <path d="m8.5 8.5 7 7" />
    </>,
    p,
  );

const Gym: IconComponent = (p) =>
  svg(
    <>
      <path d="M6.5 6.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.5" />
      <path d="M17.5 6.5H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2.5" />
      <rect x="6.5" y="4" width="3" height="16" rx="1" />
      <rect x="14.5" y="4" width="3" height="16" rx="1" />
      <path d="M9.5 12h5" />
    </>,
    p,
  );

const Entertainment: IconComponent = (p) =>
  svg(
    <>
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </>,
    p,
  );

const Movie: IconComponent = (p) =>
  svg(
    <>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </>,
    p,
  );

const Music: IconComponent = (p) =>
  svg(
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>,
    p,
  );

const Game: IconComponent = (p) =>
  svg(
    <>
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </>,
    p,
  );

const Education: IconComponent = (p) =>
  svg(
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </>,
    p,
  );

const Book: IconComponent = (p) =>
  svg(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>,
    p,
  );

const Travel: IconComponent = (p) =>
  svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>,
    p,
  );

const Plane: IconComponent = (p) =>
  svg(
    <>
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </>,
    p,
  );

const Hotel: IconComponent = (p) =>
  svg(
    <>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
      <path d="M9 22v-4h6v4" />
      <rect x="8" y="6" width="3" height="3" />
      <rect x="13" y="6" width="3" height="3" />
      <rect x="8" y="12" width="3" height="3" />
      <rect x="13" y="12" width="3" height="3" />
    </>,
    p,
  );

const Gift: IconComponent = (p) =>
  svg(
    <>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </>,
    p,
  );

const Pet: IconComponent = (p) =>
  svg(
    <>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </>,
    p,
  );

const Baby: IconComponent = (p) =>
  svg(
    <>
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
    </>,
    p,
  );

const Salary: IconComponent = (p) =>
  svg(
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>,
    p,
  );

const Investment: IconComponent = (p) =>
  svg(
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>,
    p,
  );

const Savings: IconComponent = (p) =>
  svg(
    <>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
      <path d="M2 9.5c1 0 3.6.5 4.6 2" />
      <circle cx="15.5" cy="9.5" r="0.5" fill="currentColor" />
    </>,
    p,
  );

const Insurance: IconComponent = (p) =>
  svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, p);

const Tax: IconComponent = (p) =>
  svg(
    <>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </>,
    p,
  );

const Donation: IconComponent = (p) =>
  svg(
    <>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </>,
    p,
  );

const Repair: IconComponent = (p) =>
  svg(
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </>,
    p,
  );

const Wallet: IconComponent = (p) =>
  svg(
    <>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </>,
    p,
  );

// --- Icon Registry ---

export const CATEGORY_ICONS: Record<string, IconEntry> = {
  food: { label: "Food & Dining", icon: Food },
  coffee: { label: "Coffee/Drinks", icon: Coffee },
  grocery: { label: "Groceries", icon: Grocery },
  transport: { label: "Transportation", icon: Transport },
  car: { label: "Car/Fuel", icon: Car },
  bus: { label: "Public Transit", icon: Bus },
  home: { label: "Housing/Rent", icon: Home },
  electricity: { label: "Utilities/Bills", icon: Electricity },
  wifi: { label: "Internet/Phone", icon: Wifi },
  water: { label: "Water Bill", icon: Water },
  shopping: { label: "Shopping", icon: Shopping },
  clothing: { label: "Clothing", icon: Clothing },
  health: { label: "Healthcare", icon: Health },
  pill: { label: "Pharmacy", icon: Pill },
  gym: { label: "Fitness", icon: Gym },
  entertainment: { label: "Entertainment", icon: Entertainment },
  movie: { label: "Movies/Streaming", icon: Movie },
  music: { label: "Music", icon: Music },
  game: { label: "Gaming", icon: Game },
  education: { label: "Education", icon: Education },
  book: { label: "Books", icon: Book },
  travel: { label: "Travel/Vacation", icon: Travel },
  plane: { label: "Flights", icon: Plane },
  hotel: { label: "Hotel", icon: Hotel },
  gift: { label: "Gifts", icon: Gift },
  pet: { label: "Pets", icon: Pet },
  baby: { label: "Children", icon: Baby },
  salary: { label: "Salary/Income", icon: Salary },
  investment: { label: "Investments", icon: Investment },
  savings: { label: "Savings", icon: Savings },
  insurance: { label: "Insurance", icon: Insurance },
  tax: { label: "Taxes", icon: Tax },
  donation: { label: "Charity/Donation", icon: Donation },
  repair: { label: "Maintenance/Repair", icon: Repair },
  wallet: { label: "General/Other", icon: Wallet },
};

// --- Render component ---

export interface CategoryIconProps {
  name?: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({
  name,
  size = 24,
  className,
}: CategoryIconProps) {
  const entry = name ? CATEGORY_ICONS[name] : undefined;
  const Icon = entry?.icon ?? Wallet;

  return (
    <Icon width={size} height={size} className={className} aria-hidden="true" />
  );
}
