import "../styles/Home.css";

import Hero from "../components/Hero";
import CompanyLogos from "../components/CompanyLogos";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import CallToAction from "../components/CallToAction";

function Home() {
  return (
    <>
      <Hero />
      <CompanyLogos />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </>
  );
}

export default Home;