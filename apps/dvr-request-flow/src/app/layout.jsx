import "../styles.css";

export const metadata = {
  title: "Video Request — DVR Assistant",
  icons: { icon: "/images/title_bar.jpg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
