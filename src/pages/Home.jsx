import "../styles/Home.css";

import Hero from "../components/Hero";
import CompanyLogos from "../components/CompanyLogos";
import TopResponseCompanies from "../components/TopResponseCompanies";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import CallToAction from "../components/CallToAction";

function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CallToAction />
      <CompanyLogos modo="vip" />
      <CompanyLogos modo="colaboradora" />
      <TopResponseCompanies />
      <Footer />
    </>
  );
}

export default Home;