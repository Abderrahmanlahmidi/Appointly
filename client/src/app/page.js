import { auth } from "@/lib/auth";
import HomeNavbar from "../../components/sections/home/Navbar";
import HomeHero from "../../components/sections/home/Hero";

export default async function HomePage() {
  const session = await auth();

  console.log(session?.user)

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <HomeNavbar session={session} />
      <HomeHero />
    </div>
  );
}
