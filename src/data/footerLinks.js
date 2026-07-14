const footerLinks = {
  candidates: [
    { name: "Buscar empleo", href: "/vacantes" },
    { name: "Crear perfil", href: "/register?tipo=candidato" },
    { name: "Crear CV", href: "/candidato/crear-cv" },
    { name: "Mis postulaciones", href: "/candidato/dashboard" }
  ],

  companies: [
    { name: "Publicar vacante", href: "/register?tipo=empresa" },
    { name: "Buscar talento", href: "/empresa/buscar-candidatos" },
    { name: "Planes", href: "/planes" },
    { name: "Panel empresarial", href: "/empresa/dashboard" }
  ],

  legal: [
    { name: "Política de privacidad", href: "/privacidad" },
    { name: "Términos y condiciones", href: "/terminos" },
    { name: "Cookies", href: "/cookies" },
    { name: "Contacto", href: "/contacto" }
  ]
};

export default footerLinks;