import axiosClient from "./axiosClient";

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface GoogleLoginData {
  idToken: string;
}

export const signup = async (data: SignupData) => {
  const res = await axiosClient.post("/auth/signup", data);
  return res.data;
};

export const login = async (data: LoginData) => {
  const res = await axiosClient.post("/auth/login", data);
  return res.data;
};

export const googleLogin = async (data: GoogleLoginData) => {
  const res = await axiosClient.post("/auth/google", data);
  return res.data;
};

export const uploadProfilePhoto = async (formData: FormData) => {
  const res = await axiosClient.post("/auth/profile/photo/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
