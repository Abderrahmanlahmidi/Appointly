import HomeNavbar from "../../components/sections/home/Navbar";
import HomeFooter from "../../components/sections/home/Footer";
import PreHeroSections from "../../components/sections/home/PreHeroSections";
import HomeHero from "../../components/sections/home/Hero";
import { auth } from "../../lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <HomeNavbar session={session} />
      <HomeHero />
      <PreHeroSections />
      <HomeFooter />
    </div>
  );
}
