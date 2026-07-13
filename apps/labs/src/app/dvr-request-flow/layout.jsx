import "../../dvr/styles.css";

export const metadata = {
  title: "Video Request — DVR Assistant",
  // Cache-busted — browsers cache favicons very aggressively per-origin and
  // often won't refetch a same-URL icon even on a hard reload. Bump the
  // query value if the favicon needs to change again later.
  icons: { icon: "/images/Favicon.png?v=2" },
};

export default function DvrLayout({ children }) {
  return (
    <>
      {/* React 19 hoists these stylesheet links into <head>. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      />
      {children}
    </>
  );
}
