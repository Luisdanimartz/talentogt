import { Box, Typography, Chip } from "@mui/material";

/*
  Eficiencia por etapa — cuantos dias tarda la empresa en mover a un
  candidato de un paso al siguiente.

  Es el grafico mas util del panel porque no dice "vas mal": dice
  DONDE vas mal. Por eso la etapa mas lenta se marca en rojo y se
  nombra explicitamente abajo.

  Datos reales de company_stage_efficiency() (059). Cuando una etapa
  tiene 1 o 2 muestras se avisa, en vez de presentar un promedio de
  dos casos como si fuera una tendencia.
*/

const COLOR_OK = "#0E8F73";
const COLOR_MEDIO = "#B8860B";
const COLOR_LENTO = "#C0392B";

function colorPorDias(dias, peor) {

    if (peor > 0 && dias >= peor) return COLOR_LENTO;
    if (dias >= 5) return COLOR_MEDIO;

    return COLOR_OK;

}

function StageEfficiency({ etapas, loading }) {

    if (loading) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Calculando tiempos por etapa…
            </Typography>
        );
    }

    const filas = (etapas || []).filter((e) => Number(e.muestras) > 0);

    if (filas.length === 0) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Todavía no hay suficientes movimientos para medir los
                tiempos. En cuanto empieces a cambiar el estado de tus
                candidatos, aquí vas a ver cuántos días tardas en cada
                paso del proceso.
            </Typography>
        );
    }

    const maximo = Math.max(...filas.map((f) => Number(f.dias_promedio) || 0));

    /* La etapa mas lenta, solo si de verdad destaca sobre las demas */
    const peor = filas.length > 1 && maximo >= 3 ? maximo : 0;

    const masLenta = peor
        ? filas.find((f) => Number(f.dias_promedio) === peor)
        : null;

    const totalDias = filas.reduce(
        (suma, f) => suma + (Number(f.dias_promedio) || 0),
        0
    );

    return (

        <Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 2.5,
                }}
            >

                {filas.map((fila) => {

                    const dias = Number(fila.dias_promedio) || 0;
                    const muestras = Number(fila.muestras) || 0;
                    const ancho = maximo > 0 ? (dias / maximo) * 100 : 0;
                    const color = colorPorDias(dias, peor);

                    return (

                        <Box key={fila.etapa}>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    gap: 1,
                                    mb: 0.6,
                                }}
                            >

                                <Typography fontSize={13.5} fontWeight={600}>
                                    {fila.etiqueta}
                                </Typography>

                                <Typography
                                    fontSize={13.5}
                                    fontWeight={700}
                                    sx={{ color, whiteSpace: "nowrap" }}
                                >
                                    {dias < 1
                                        ? "Menos de 1 día"
                                        : `${dias} día${dias === 1 ? "" : "s"}`}
                                </Typography>

                            </Box>

                            <Box
                                sx={{
                                    height: 10,
                                    borderRadius: 999,
                                    background: "#EEF1F5",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${Math.max(ancho, 3)}%`,
                                        height: "100%",
                                        background: color,
                                        borderRadius: 999,
                                        transition: "width 0.4s ease",
                                    }}
                                />
                            </Box>

                            <Typography
                                fontSize={11.5}
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                {muestras} candidato{muestras === 1 ? "" : "s"}
                                {muestras < 3 && " · aún son pocos casos para sacar conclusiones"}
                            </Typography>

                        </Box>

                    );

                })}

            </Box>

            <Box
                sx={{
                    borderTop: "1px solid #E6E8EC",
                    pt: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    alignItems: "center",
                }}
            >

                <Chip
                    size="small"
                    label={`Proceso completo: ${Math.round(totalDias)} días`}
                    sx={{
                        background: "#E4F5F0",
                        color: "#0B5341",
                        fontWeight: 700,
                    }}
                />

                {masLenta && (
                    <Typography fontSize={12.5} color="text.secondary">
                        Tu cuello de botella está en{" "}
                        <strong>{masLenta.etiqueta.toLowerCase()}</strong>.
                        Ahí es donde más ganas si aceleras.
                    </Typography>
                )}

            </Box>

        </Box>

    );

}

export default StageEfficiency;
