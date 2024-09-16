// src/utils/apiService.js

const API_URL = process.env.REACT_APP_API_URL || 'https://rational-killdeer-thoroughly.ngrok-free.app';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
      ////
    }
    return response.json();
  } catch (error) {
    console.error('Fetch data error:', error);
    throw error;
  }
};

export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  } catch (error) {
    console.error('Post data error:', error);
    throw error;
  }
};
