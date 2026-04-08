import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StepCards from "@/components/StepCards";
import ReferralForm from "@/components/ReferralForm";
import JobLink from "@/components/JobLink";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <StepCards />
      <ReferralForm />
      <JobLink />
      <Footer />
    </>
  );
}
