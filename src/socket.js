export const initSocket = () => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(process.env.REACT_APP_BACKEND_URL);

        socket.onopen = () => resolve(socket);
        socket.onerror = (error) => reject(error);
    });
};
