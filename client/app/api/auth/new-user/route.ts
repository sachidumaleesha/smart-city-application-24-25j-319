import { NextResponse } from "next/server";
import { currentUser, auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  console.log("New user route hit");
  console.log("Request URL:", request.url);

  try {
    const client = await clerkClient()
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    const metaData = await currentUser();
    const roleName = metaData!.publicMetadata.role;

    if (!userId) {
      console.log("No user ID, returning unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    console.log("Current user:", user ? "Found" : "Not found");

    if (!user) {
      console.log("No current user, returning not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "MEMBER" },
    });

    console.log("Attempting to upsert user in database");
    if (!dbUser) {
      const dbUser = await prisma.user.upsert({
        where: { clerkId: user.id },
        update: {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.emailAddresses[0].emailAddress ?? "",
          imageUrl: user.imageUrl ?? "",
        },
        create: {
          clerkId: user.id,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.emailAddresses[0].emailAddress ?? "",
          imageUrl: user.imageUrl ?? "",
        },
      });
    }

    console.log("Redirecting to dashboard");

    if (roleName === "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard", process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (error) {
    console.error("Error in new-user route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
