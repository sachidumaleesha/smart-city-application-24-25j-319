import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const getUserRole = async () => {
    const metaData = await currentUser();
    const roleName = metaData!.publicMetadata.role;
    return roleName;
  };

  if ((await getUserRole()) === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
