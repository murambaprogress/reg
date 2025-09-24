import axios from '@/utils/axios';

export const searchCustomers = async ({ search = '' } = {}) => {
  const response = await axios.get(`/customers/search`, {
    params: { search }
  });
  return response.data;
};

export const getAllCustomers = async () => {
  const response = await axios.get(`/customers/`);
  return response.data;
};


export const getCustomer = async (customerId) => {
  const response = await axios.get(`/customers/${customerId}`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await axios.post('/customers/', data);
  return response.data;
};

export const updateCustomer = async ({ id, ...data }) => {
  const response = await axios.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await axios.delete(`/customers/${id}`);
  return response.data;
};
