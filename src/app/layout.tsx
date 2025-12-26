import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import Navigation from "@/components/Navigation";
import { Box, Toolbar } from "@mui/material";

export const metadata: Metadata = {
  title: "NomNom - Recipe Manager",
  description: "Store, organize, and plan meals from your favorite recipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Box sx={{ display: "flex" }}>
            <Navigation />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                width: { md: "calc(100% - 240px)" },
                minHeight: "100vh",
                backgroundColor: "background.default",
              }}
            >
              <Toolbar />
              {children}
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
