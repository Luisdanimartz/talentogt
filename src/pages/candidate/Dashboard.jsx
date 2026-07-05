import { useState } from "react";

import StatCard from "../../components/ui/StatCard";
import ProcessCard from "../../components/process/ProcessCard";
import ProcessTimeline from "../../components/timeline/ProcessTimeline";

import { dashboardStats } from "../../data/dashboard";
import { timeline } from "../../data/timeline";
import applications from "../../mock/applications";
import user from "../../session/user";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

function Dashboard() {

  const [open, setOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const handleOpen = (application) => {
    setSelectedProcess(application);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProcess(null);
  };

  return (
    <div className="dashboard">

      {/* ENCABEZADO */}

      <div className="dashboard-header">

        <div>

          <h1>
            Bienvenido, {user.name} 👋
          </h1>

          <p>

            {user.accountType} • Completa tu perfil para aumentar tus posibilidades de conseguir empleo.

          </p>

        </div>

        <button className="profile-btn">
          Ver mi perfil
        </button>

      </div>

      {/* PERFIL */}

      <div className="profile-progress">

        <div className="progress-header">

          <span>Perfil completado</span>

          <strong>18%</strong>

        </div>

        <div className="progress-bar">

          <div className="progress-fill"></div>

        </div>

      </div>

      {/* ESTADÍSTICAS */}

      <div className="dashboard-grid">

        {dashboardStats.map((stat) => (

          <StatCard
            key={stat.id}
            number={stat.number}
            title={stat.title}
            icon={stat.icon}
          />

        ))}

      </div>

      {/* CONTENIDO */}

      <div className="dashboard-columns">

        <div className="activity">

          <h2>Actividad reciente</h2>

          <ul>

            <li>✅ Banco Industrial revisó tu CV.</li>

            <li>📅 Entrevista programada para mañana.</li>

            <li>📩 Tienes un mensaje nuevo del reclutador.</li>

            <li>🎉 Has enviado {applications.length} postulaciones.</li>

          </ul>

        </div>

        <div className="processes">

          <h2>Mis procesos activos</h2>

          {applications.map((application) => (

            <ProcessCard
              key={application.id}
              job={application.job}
              company={application.company}
              status={application.status}
              progress={application.progress}
              nextStep={application.nextStep}
              updated={application.updated}
              onView={() => handleOpen(application)}
            />

          ))}

        </div>

      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >

        <DialogTitle>

          {selectedProcess?.job}

          <br />

          <small>{selectedProcess?.company}</small>

        </DialogTitle>

        <DialogContent>

          <ProcessTimeline steps={timeline} />

        </DialogContent>

        <DialogActions>

          <Button onClick={handleClose}>
            Cerrar
          </Button>

        </DialogActions>

      </Dialog>

    </div>
  );
}

export default Dashboard;