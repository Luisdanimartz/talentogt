import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
} from "@mui/material";

import CompanyProfileForm from "../../components/company/CompanyProfileForm";
import { useAuth } from "../../context/AuthContext";
import { createCompanyProfile } from "../../services/companyService";

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.commercialName.trim()) {
      newErrors.commercialName = "Ingrese el nombre comercial.";
    }

    if (!form.legalName.trim()) {
      newErrors.legalName = "Ingrese la razon social.";
    }

    if (!form.nit.trim()) {
      newErrors.nit = "Ingrese el NIT.";
    }

    if (!form.department.trim()) {
      newErrors.department = "Ingrese el departamento.";
    }

    if (!form.municipality.trim()) {
      newErrors.municipality = "Ingrese el municipio.";
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

    const { error } = await createCompanyProfile(user.id, form);

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
