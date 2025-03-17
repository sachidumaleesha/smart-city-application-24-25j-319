import type React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import AuthImage from "@/public/images/auth.jpg";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={AuthImage}
          alt="Background Image"
          fill
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 dark:bg-black/60" />
        <div className="absolute left-6 top-6 z-10 flex items-center gap-2 font-medium text-white md:left-10 md:top-10">
          <Link href={"/"} className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-primary">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div>Smart City 🏙️.</div>
          </Link>
        </div>
        <div className="absolute z-10 p-6 md:p-10 bottom-0 mt-auto">
          <blockquote>
            <p className="text-lg text-white">
              &ldquo;​Welcome to our Smart City Portal, where we harness cutting-edge technologies to enhance urban living. Our integrated solutions encompass smart parking management, intelligent waste systems, advanced surveillance, and real-time accident detection, all designed to create a more connected, efficient, and safer urban environment.&rdquo;
            </p>
            <footer className="text-sm text-white">
              <cite>David S.</cite>
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* mobile to tablet */}
        <div className="flex justify-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            App Name 👋.
          </Link>
        </div>

        {/* children */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
