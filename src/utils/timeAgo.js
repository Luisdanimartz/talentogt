/* "hace 2 horas", "hace 3 dias", "hace 1 semana" */

export function tiempoDesde(fecha) {

    if (!fecha) return "";

    const segundos = Math.floor(
        (Date.now() - new Date(fecha).getTime()) / 1000
    );

    if (segundos < 60) return "hace un momento";

    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) {
        return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
    }

    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
        return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
    }

    const dias = Math.floor(horas / 24);
    if (dias < 7) {
        return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
    }

    const semanas = Math.floor(dias / 7);
    if (semanas < 5) {
        return `hace ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
    }

    const meses = Math.floor(dias / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;

}
