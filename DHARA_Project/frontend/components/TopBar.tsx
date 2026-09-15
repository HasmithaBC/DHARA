import { fetchSettings } from "@/lib/api";
import { IconClock, IconFacebook, IconInstagram, IconLinkedIn, IconMail, IconPhone, IconPinterest } from "@/components/icons";

const SOCIAL_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  facebook: IconFacebook,
  linkedin: IconLinkedIn,
  instagram: IconInstagram,
  pinterest: IconPinterest,
};

/**
 * Slim contact/hours strip above the main header — the small "we're a real,
 * reachable company" signal that construction and property sites lean on.
 * Hidden on small screens to keep the mobile header compact.
 */
export default async function TopBar() {
  const settings = await fetchSettings();
  const contact = settings.contact ?? {
    phone: "+94763774551",
    email: "kosala@dharact.com",
  };
  const social = settings.social ?? {};
  const socialLinks = Object.entries(social).filter(([, url]) => !!url);

  return (
    <div className="hidden border-b border-white/10 bg-concrete-900 text-stone-line lg:block">
      <div className="container-content flex h-9 items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-brass-light">
            <IconPhone className="h-3 w-3" />
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 transition-colors hover:text-brass-light">
            <IconMail className="h-3 w-3" />
            {contact.email}
          </a>
          <span className="flex items-center gap-1.5 text-stone-line/70">
            <IconClock className="h-3 w-3" />
            Mon – Sat, 8:30am – 5:30pm
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-brass-light/90">Concepts Into Creation</span>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                if (!Icon) return null;
                return (
                  <a key={key} href={url as string} target="_blank" rel="noopener noreferrer" aria-label={key} className="transition-colors hover:text-brass-light">
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
