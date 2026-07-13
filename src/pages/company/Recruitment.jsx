import { useState } from "react";

import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox
} from "@mui/material";

function Recruitment() {

  const [open, setOpen] = useState(false);

  const [reason, setReason] = useState("");

  const [notify, setNotify] = useState(true);

  const [email, setEmail] = useState(true);

  return (

    <Box sx={{ maxWidth: 900, margin: "40px auto" }}>

      <Paper sx={{ p: 4, borderRadius: 4 }}>

        <Typography variant="h4" fontWeight="bold">

          Gestión del Proceso de Selección

        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>

          Vacante: Asesor Comercial

        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h5">

          Juan Pérez

        </Typography>

        <Typography color="text.secondary">

          Postulado hace 5 días

        </Typography>

        <Chip
          label="CV Revisado"
          color="primary"
          sx={{ mt: 3 }}
        />

        <Typography sx={{ mt: 4, mb: 2 }}>

          Cambiar etapa

        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >

          <Button variant="outlined">
            CV enviado
          </Button>

          <Button variant="outlined">
            CV revisado
          </Button>

          <Button variant="outlined">
            CV evaluado
          </Button>

          <Button variant="outlined">
            Reclutador asignado
          </Button>

          <Button variant="outlined">
            Entrevista programada
          </Button>

        </Box>

        <Divider sx={{ my: 5 }} />

        <Button
          color="error"
          variant="contained"
          size="large"
          onClick={() => setOpen(true)}
        >

          FINALIZAR PROCESO

        </Button>

      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle>

          Finalizar proceso

        </DialogTitle>

        <DialogContent>

          <Typography sx={{ mb: 3 }}>

            ¿Por qué finaliza el proceso?

          </Typography>

          <RadioGroup
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >

            <FormControlLabel
              value="Otro candidato fue seleccionado"
              control={<Radio />}
              label="Otro candidato fue seleccionado"
            />

            <FormControlLabel
              value="El perfil no se ajusta"
              control={<Radio />}
              label="El perfil no se ajusta a la vacante"
            />

            <FormControlLabel
              value="El candidato retiró su postulación"
              control={<Radio />}
              label="El candidato retiró su postulación"
            />

            <FormControlLabel
              value="La vacante fue cancelada"
              control={<Radio />}
              label="La vacante fue cancelada"
            />

            <FormControlLabel
              value="Otro motivo"
              control={<Radio />}
              label="Otro motivo"
            />

          </RadioGroup>

          <Divider sx={{ my: 3 }} />

          <FormControlLabel
            control={
              <Checkbox
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
            }
            label="Notificar al candidato en ChanceGT"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
              />
            }
            label="Enviar correo electrónico"
          />

        </DialogContent>

        <DialogActions>

          <Button onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="error"
          >
            Confirmar
          </Button>

        </DialogActions>

      </Dialog>

    </Box>

  );

}

export default Recruitment;