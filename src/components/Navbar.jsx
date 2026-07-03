function Navbar() {
  return (
    <header className="navbar">
      <h2 className="logo">TalentoGT</h2>

      <nav>
        <a href="#">Inicio</a>
        <a href="#">Empleos</a>
        <a href="#">Empresas</a>
        <a href="#">Crear CV</a>
      </nav>

      <button className="login">
        Iniciar sesión
      </button>
    </header>
  );
}

export default Navbar;