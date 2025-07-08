import axios from 'axios';

const API_URL = 'http://localhost:7096/Point'; // Örnek API

export const getData = () => axios.get(`${API_URL}/GetAll`);
export const addData = (data) => axios.post(`${API_URL}/Add`, data);
export const updateLocation = (id, data) => axios.put(`${API_URL}/Update/${id}`, data);
export const deleteLocation = (id) => axios.delete(`${API_URL}/Delete/${id}`);
