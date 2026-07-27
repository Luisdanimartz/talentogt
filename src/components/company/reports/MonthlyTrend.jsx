import { Box, Typography } from "@mui/material";

/*
  Tendencia mensual — postulaciones y contrataciones mes a mes.

  Dibujado con CSS, sin librerias de graficas: el bundle de ChanceGT
  ya se optimizo una vez de 950KB a 310KB y no vale la pena volver a
  subirlo por unas barras.

  Los meses sin movimiento se muestran vacios a proposito. Saltarselos
  haria ver una linea de crecimiento donde en realidad hubo un hueco.
*/

const MESES_CORTOS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function etiquetaMes(valor) {

    const fecha = new Date(`${String(valor).slice(0, 10)}T12:00:00`);

    if (Number.isNaN(fecha.getTime())) return "";

    return MESES_CORTOS[fecha.getMonth()];

}

function MonthlyTrend({ meses, loading }) {

    if (loading) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Cargando la tendencia…
            </Typography>
        );
    }

    const filas = meses || [];

    const hayDatos = filas.some((m) => Number(m.postulaciones) > 0);

    if (!hayDatos) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Aún no hay postulaciones registradas en los últimos
                meses. Cuando empiecen a llegar, aquí vas a ver si tu
                proceso mejora o se atrasa con el tiempo.
            </Typography>
        );
    }

    const maximo = Math.max(
        ...filas.map((m) => Number(m.postulaciones) || 0),
        1
    );

    return (

        <Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 1,
                    height: 190,
                    borderBottom: "1px solid #E6E8EC",
                    pb: 1,
                }}
            >

                {filas.map((mes) => {

                    const postulaciones = Number(mes.postulaciones) || 0;
                    const contratados = Number(mes.contratados) || 0;

                    const alto = (postulaciones / maximo) * 100;

                    const altoContratados =
                        postulaciones > 0
                            ? (contratados / postulaciones) * 100
                            : 0;

                    return (

                        <Box
                            key={mes.mes}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                height: "100%",
                                gap: 0.6,
                            }}
                            title={
                                `${postulaciones} postulación(es)` +
                                (contratados > 0
                                    ? ` · ${contratados} contratado(s)`
                                    : "")
                            }
                        >

                            <Typography
                                fontSize={11.5}
                                fontWeight={700}
                                color={postulaciones ? "#0B1F3A" : "#B4BCC6"}
                            >
                                {postulaciones}
                            </Typography>

                            <Box
                                sx={{
                                    width: "100%",
                                    maxWidth: 42,
                                    height: `${Math.max(alto, postulaciones ? 4 : 1)}%`,
                                    background: "#DCE6F2",
                                    borderRadius: "6px 6px 0 0",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    overflow: "hidden",
                                    transition: "height 0.4s ease",
                                }}
                            >

                                {contratados > 0 && (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: `${altoContratados}%`,
                                            background: "#0E8F73",
                                        }}
                                    />
                                )}

                            </Box>

                        </Box>

                    );

                })}

            </Box>

            <Box sx={{ display: "flex", gap: 1, mt: 0.8 }}>

                {filas.map((mes) => (
                    <Typography
                        key={`lbl-${mes.mes}`}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            textAlign: "center",
                            fontSize: 11,
                            color: "text.secondary",
                        }}
                    >
                        {etiquetaMes(mes.mes)}
                    </Typography>
                ))}

            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: 2.5,
                    mt: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: 0.5,
                            background: "#DCE6F2",
                        }}
                    />
                    <Typography fontSize={12.5} color="text.secondary">
                        Postulaciones recibidas
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: 0.5,
                            background: "#0E8F73",
                        }}
                    />
                    <Typography fontSize={12.5} color="text.secondary">
                        Terminaron contratadas
                    </Typography>
                </Box>

            </Box>

        </Box>

    );

}

export default MonthlyTrend;
