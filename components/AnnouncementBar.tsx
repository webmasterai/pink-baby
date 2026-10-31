import { siteConfig } from "@/content/site";

export function AnnouncementBar() {
  return (
    <div className="bg-[#d7e3d3] text-pb-charcoal">
      <p className="px-3 py-2 text-center text-sm font-medium tracking-wide md:px-4 md:text-[0.95rem]">
        {siteConfig.announcement}{" "}
        <span aria-hidden="true" className="text-pb-pink">
          ♥
        </span>
      </p>
    </div>
  );
}
