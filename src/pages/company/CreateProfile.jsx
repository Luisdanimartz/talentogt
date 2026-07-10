import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
} from "@mui/material";

import CompanyProfileForm from "../../components/company/CompanyProfileForm";

import { useAuth } from "../../context/AuthContext";

import {
  createCompanyProfile,
} from "../../services/companyService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../../services/locationService";

const initialForm = {
  commercialName: "",
  legalName: "",
  nit: "",
  phone: "",
  website: "",
  department: "",
  municipality: "",
  address: "",
  description: "",
};

function CreateProfile() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);

  const [departments, setDepartments] = useState([]);

  const [municipalities, setMunicipalities] = useState([]);

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    loadDepartments();

  }, []);

  useEffect(() => {

    if (form.department) {

      loadMunicipalities(form.department);

    } else {

      setMunicipalities([]);

    }

  }, [form.department]);

  async function loadDepartments() {

    const { data, error } = await getDepartments();

    if (!error) {

      setDepartments(data);

    }

  }

  async function loadMunicipalities(departmentId) {

  console.log("Departamento seleccionado:", departmentId);

  const { data, error } =
    await getMunicipalitiesByDepartment(departmentId);

  console.log("Municipios recibidos:", data);
  console.log("Error:", error);

  if (!error) {

    setMunicipalities(data);

  }

}

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({

      ...prev,

      [name]: value,

      ...(name === "department"
        ? { municipality: "" }
        : {}),

    }));

  };

  const validate = () => {

    const newErrors = {};

    if (!form.commercialName.trim()) {

      newErrors.commercialName =
        "Ingrese el nombre comercial.";

    }

    if (!form.legalName.trim()) {

      newErrors.legalName =
        "Ingrese la razón social.";

    }

    if (!form.nit.trim()) {

      newErrors.nit =
        "Ingrese el NIT.";

    }

    if (!form.department) {

      newErrors.department =
        "Seleccione un departamento.";

    }

    if (!form.municipality) {

      newErrors.municipality =
        "Seleccione un municipio.";

    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleSubmit = async () => {

    if (!validate()) return;

    if (!user) {

      navigate("/login");

      return;

    }

    setLoading(true);
        const { error } = await createCompanyProfile(
      user.id,
      form
    );

    setLoading(false);

    if (error) {

      setErrors({
        general: error.message,
      });

      return;

    }

    navigate("/empresa/dashboard");

  };

  return (

    <Box
      sx={{
        maxWidth: 1100,
        margin: "40px auto",
        p: 3,
      }}
    >

      <Paper
        elevation={5}
        sx={{
          p: 5,
          borderRadius: 5,
        }}
      >

        <CompanyProfileForm
          form={form}
          departments={departments}
          municipalities={municipalities}
          errors={errors}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

      </Paper>

    </Box>

  );

}

export default CreateProfile;