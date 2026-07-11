/*
  Estados oficiales de una postulación en ChanceGT.
  Un solo lugar para que candidato y empresa hablen el mismo idioma.
*/

export const APPLICATION_STATUSES = [
    { value: "applied", label: "Enviada", tone: "slate" },
    { value: "reviewing", label: "En revisión", tone: "amber" },
    { value: "interview", label: "Entrevista", tone: "navy" },
    { value: "hired", label: "Contratado", tone: "teal" },
    { value: "rejected", label: "No seleccionado", tone: "red" },
];

export const STATUS_LABELS = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s.value, s.label])
);

export function statusLabel(value) {
    return STATUS_LABELS[value] || value || "Enviada";
}
