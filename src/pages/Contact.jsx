import { useState } from "react";

import "../styles/Contact.css";

import { sendContactMessage } from "../services/contactService";

function Contact() {

    const [form, setForm] = useState({ nombre: "", correo: "", mensaje: "" });
    const [enviando, setEnviando] = useState(false);
    const [estado, setEstado] = useState(null); // "ok" | "error" | null

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {

        e.preventDefault();

        if (!form.nombre.trim() || !form.correo.trim() || !form.mensaje.trim()) {
            setEstado("error");
            return;
        }

        setEnviando(true);
        setEstado(null);

        const { error } = await sendContactMessage(form);

        setEnviando(false);

        if (error) {
            setEstado("error");
            return;
        }

        setEstado("ok");
        setForm({ nombre: "", correo: "", mensaje: "" });

    }

    return (

        <div className="contact-page">

            <div className="contact-card">

                <h1>Hablemos</h1>

                <p>
                    ¿Tienes una pregunta, sugerencia, o quieres saber
                    más de ChanceGT? Escríbenos, te respondemos
                    directamente.
                </p>

                {estado === "ok" ? (

                    <div className="contact-success">
                        <h3>¡Mensaje enviado! ✓</h3>
                        <p>
                            Gracias por escribirnos, te responderemos
                            lo antes posible.
                        </p>
                    </div>

                ) : (

                    <form onSubmit={handleSubmit} className="contact-form">

                        <label>
                            Nombre
                            <input
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label>
                            Correo electrónico
                            <input
                                type="email"
                                name="correo"
                                value={form.correo}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label>
                            Mensaje
                            <textarea
                                name="mensaje"
                                rows={5}
                                value={form.mensaje}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        {estado === "error" && (
                            <p className="contact-error">
                                Completa todos los campos, o intenta de
                                nuevo en un momento.
                            </p>
                        )}

                        <button type="submit" disabled={enviando}>
                            {enviando ? "Enviando…" : "Enviar mensaje"}
                        </button>

                    </form>

                )}

                <p className="contact-alt">
                    También puedes escribir directo a{" "}
                    <a href="mailto:info@chancegt.com">info@chancegt.com</a>
                </p>

            </div>

        </div>

    );

}

export default Contact;
