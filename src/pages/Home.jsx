import "../styles/Home.css";

import Hero from "../components/Hero";
import CompanyLogos from "../components/CompanyLogos";
import TopResponseCompanies from "../components/TopResponseCompanies";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import CallToAction from "../components/CallToAction";
import Testimonials from "../components/Testimonials";

function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CallToAction />
      <CompanyLogos modo="vip" />
      <TopResponseCompanies />
      <Testimonials />
      <Footer />
    </>
  );
}

export default Home;