import axios, { AxiosRequestConfig } from "axios";
import { URL_API } from "../../constants/api";
import {
  Traspaso,
  TraspasoDetalle,
  CrearTraspasoRequest,
  ArticuloCosto,
  CostosRequest,
  FiltrosTraspasos,
} from "../../types/traspasos";

const BASE_URL = URL_API;

export const getTraspasos = async (filtros?: FiltrosTraspasos): Promise<Traspaso[]> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/traspasos`,
    method: "GET",
    params: filtros,
  };
  const response = await axios.request<Traspaso[]>(options);
  return response.data;
};

export const getTraspasoById = async (doctoInId: number): Promise<TraspasoDetalle> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/traspasos/${doctoInId}`,
    method: "GET",
  };
  const response = await axios.request<TraspasoDetalle>(options);
  return response.data;
};

export const crearTraspaso = async (data: CrearTraspasoRequest): Promise<{ message: string; doctoInId: number }> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/traspasos`,
    method: "POST",
    data,
  };
  const response = await axios.request<{ message: string; doctoInId: number }>(options);
  return response.data;
};

export const getCostosArticulos = async (data: CostosRequest): Promise<ArticuloCosto[]> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/traspasos/costos`,
    method: "POST",
    data,
  };
  const response = await axios.request<ArticuloCosto[]>(options);
  return response.data;
};
