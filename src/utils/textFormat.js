/* "GUATEMALA" -> "Guatemala", "SAN JUAN SACATEPEQUEZ" -> "San Juan Sacatepequez" */
export function toTitleCase(texto) {

    return String(texto || "")
        .toLowerCase()
        .split(" ")
        .map((palabra) =>
            palabra.length > 2 || palabra === "de"
                ? palabra === "de" || palabra === "la" || palabra === "el" || palabra === "los" || palabra === "las" || palabra === "del"
                    ? palabra
                    : palabra.charAt(0).toUpperCase() + palabra.slice(1)
                : palabra.charAt(0).toUpperCase() + palabra.slice(1)
        )
        .join(" ");

}
