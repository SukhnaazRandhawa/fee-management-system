import axios from 'axios';

const API_URL = 'http://localhost:5050/api/payments/';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const makePayment = (paymentData) => {
    return axios.post(API_URL, paymentData, { headers: getAuthHeader() });
};

const getPaymentsByClass = (classId) => {
    return axios.get(API_URL + `class/${classId}`, { headers: getAuthHeader() });
};

const paymentService = {
    makePayment,
    getPaymentsByClass,
};

export default paymentService; 