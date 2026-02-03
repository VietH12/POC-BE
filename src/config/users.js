/**
 * Hardcoded users database
 * No authentication required - users just select from this list
 */

export const USERS = [
    {
        id: '1',
        name: 'Bác sĩ A',
        role: 'doctor',
        avatar: '👨‍⚕️',
        status: 'offline',
        currentRoom: null
    },
    {
        id: '2',
        name: 'Bác sĩ B',
        role: 'doctor',
        avatar: '👨‍⚕️',
        status: 'offline',
        currentRoom: null
    },
    {
        id: '3',
        name: 'Điều dưỡng C',
        role: 'nurse',
        avatar: '👩‍⚕️',
        status: 'offline',
        currentRoom: null
    },
    {
        id: '4',
        name: 'Chuyên gia D',
        role: 'specialist',
        avatar: '🧑‍⚕️',
        status: 'offline',
        currentRoom: null
    },
    {
        id: '5',
        name: 'Bác sĩ E',
        role: 'doctor',
        avatar: '👨‍⚕️',
        status: 'offline',
        currentRoom: null
    },
    {
        id: '6',
        name: 'Y tá F',
        role: 'nurse',
        avatar: '👩‍⚕️',
        status: 'offline',
        currentRoom: null
    }
];

// In-memory user state management
let userStates = new Map();

// Initialize user states
USERS.forEach(user => {
    userStates.set(user.id, {
        ...user,
        status: 'offline',
        currentRoom: null,
        socketId: null
    });
});

export const getUserById = (userId) => {
    return userStates.get(userId);
};

export const getAllUsers = () => {
    return Array.from(userStates.values());
};

export const updateUserStatus = (userId, status, roomId = null) => {
    const user = userStates.get(userId);
    if (user) {
        user.status = status;
        user.currentRoom = roomId;
        userStates.set(userId, user);
    }
    return user;
};

export const setUserSocket = (userId, socketId) => {
    const user = userStates.get(userId);
    if (user) {
        user.socketId = socketId;
        userStates.set(userId, user);
    }
    return user;
};

export const getUserBySocketId = (socketId) => {
    return Array.from(userStates.values()).find(user => user.socketId === socketId);
};
