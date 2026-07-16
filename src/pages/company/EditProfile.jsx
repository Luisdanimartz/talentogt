import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Paper, Alert, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

import CompanyProfileForm from "../../components/company/CompanyProfileForm";

import { updateCompanyProfile } from "../../services/companyService";
import { getMyCompanyContext } from "../../services/teamService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../../services/locationService";

function EditProfile() {

  const navigate = useNavigate();

  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {

    loadData();

  }, []);

  useEffect(() => {

    if (form?.department) {
      loadMunicipalities(form.department);
    } else {
      setMunicipalities([]);
    }

  }, [form?.department]);

  async function loadData() {

    const [{ company, role, error: companyError }, departmentsRes] =
      await Promise.all([getMyCompanyContext(), getDepartments()]);

    setDepartments(departmentsRes.data || []);

    if (companyError || !company) {
      setNotFound(true);
      return;
    }

    setProfileId(company.id);
    setSoloLectura(role === "observador");

    setForm({
      commercialName: company.company_name || "",
      legalName: company.legal_name || "",
      nit: company.nit || "",
      phone: company.phone || "",
      website: company.website || "",
      department: company.department_id || "",
      municipality: company.municipality_id || "",
      address: company.address || "",
      description: company.description || "",
    });

  }

  async function loadMunicipalities(departmentId) {

    const { data } = await getMunicipalitiesByDepartment(departmentId);

    setMunicipalities(data || []);

  }

  function handleChange(e) {

    const { name, value } = e.target;

    setForm((prev) => ({

      ...prev,

      [name]: value,

      ...(name === "department" ? { municipality: "" } : {}),

    }));

    setGuardado(false);

  }

  function validate() {

    const newErrors = {};

    if (!form.commercialName.trim()) {
      newErrors.commercialName = "Ingrese el nombre comercial.";
    }

    if (!form.legalName.trim()) {
      newErrors.legalName = "Ingrese la razón social.";
    }

    if (!form.nit.trim()) {
      newErrors.nit = "Ingrese el NIT.";
    }

    if (!form.department) {
      newErrors.department = "Seleccione un departamento.";
    }

    if (!form.municipality) {
      newErrors.municipality = "Seleccione un municipio.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  }

  async function handleSubmit() {

    if (soloLectura) return;

    if (!validate()) return;

    setLoading(true);
    setGuardado(false);

    const { error } = await updateCompanyProfile(profileId, form);

    setLoading(false);

    if (error) {
      setErrors({ general: error.message });
      return;
    }

    setGuardado(true);

  }

  if (notFound) {

    return (

      <Box sx={{ maxWidth: 1100, margin: { xs: "20px auto", md: "40px auto" }, p: { xs: 2, md: 3 } }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/empresa/dashboard")}
          sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: "#0B1F3A" }}
        >
          Volver al dashboard
        </Button>

        <Alert severity="warning">
          No se encontró el perfil de tu empresa. Complétalo primero desde{" "}
          <a href="/empresa/crear-perfil">este enlace</a>.
        </Alert>

      </Box>

    );

  }

  if (!form) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Cargando...</p>;
  }

  return (

    <Box sx={{ maxWidth: 1100, margin: { xs: "20px auto", md: "40px auto" }, p: { xs: 2, md: 3 } }}>

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/empresa/dashboard")}
        sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: "#0B1F3A" }}
      >
        Volver al dashboard
      </Button>

      <Paper elevation={5} sx={{ p: { xs: 3, md: 5 }, borderRadius: 5 }}>

        {soloLectura && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Tu rol es de solo lectura (observador): puedes ver el perfil de
            la empresa, pero no editarlo.
          </Alert>
        )}

        {guardado && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Perfil actualizado correctamente.
          </Alert>
        )}

        <CompanyProfileForm
          form={form}
          departments={departments}
          municipalities={municipalities}
          errors={errors}
          loading={loading || soloLectura}
          onChange={handleChange}
          onSubmit={handleSubmit}
          title="Editar perfil de empresa"
          subtitle="Actualiza la información de tu empresa."
          submitLabel="Guardar cambios"
        />

      </Paper>

    </Box>

  );

}

export default EditProfile;
