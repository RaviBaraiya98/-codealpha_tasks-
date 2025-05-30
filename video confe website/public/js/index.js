console.log('Index module loaded');

// Initialize Socket.IO connection
const socket = io(window.CONFIG.SOCKET_URL, {
  auth: {
    token: Auth.getToken()
  }
});

// Toast notification system
const toast = {
  container: document.getElementById('toastContainer'),
  
  show(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },
  
  success(message) {
    this.show(message, 'success');
  },
  
  error(message) {
    this.show(message, 'error');
  },
  
  info(message) {
    this.show(message, 'info');
  }
};

// DOM Elements
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomIdInput = document.getElementById('roomIdInput');
const joinRoomSubmitBtn = document.getElementById('joinRoomSubmitBtn');
const createRoomModal = document.getElementById('createRoomModal');
const roomPasswordModal = document.getElementById('roomPasswordModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const roomNameInput = document.getElementById('roomNameInput');
const isPrivateCheckbox = document.getElementById('isPrivateCheckbox');
const passwordGroup = document.getElementById('passwordGroup');
const createRoomPasswordInput = document.getElementById('createRoomPasswordInput');
const createRoomSubmitBtn = document.getElementById('createRoomSubmitBtn');
const roomPasswordInput = document.getElementById('roomPasswordInput');
const submitPasswordBtn = document.getElementById('submitPasswordBtn');
const activeRoomsSection = document.getElementById('activeRoomsSection');
const activeRoomsContainer = document.getElementById('activeRoomsContainer');
const notLoggedInSection = document.getElementById('notLoggedInSection');

// Store room that requires password
let currentPasswordProtectedRoom = null;

// Initialize UI based on authentication state
Auth.updateUIForAuthState();

document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    createRoomBtn.addEventListener('click', () => {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }
        showCreateRoomModal();
    });

    joinRoomBtn.addEventListener('click', () => {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }
        showJoinRoomModal();
    });

    // Socket.IO event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        if (Auth.isAuthenticated()) {
            fetchActiveRooms();
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('userJoined', (data) => {
        toast.success(`${data.username} joined the room`);
        fetchActiveRooms();
    });

    socket.on('userLeft', (data) => {
        toast.info(`${data.username} left the room`);
        fetchActiveRooms();
    });

    // Room Management
    async function fetchActiveRooms() {
        try {
            const response = await fetch(`${window.CONFIG.API_URL}/room/active`, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active rooms');
            }

            const { rooms } = await response.json();
            displayActiveRooms(rooms);
        } catch (error) {
            console.error('Failed to fetch active rooms:', error);
            toast.error('Failed to load active rooms');
        }
    }

    function displayActiveRooms(rooms) {
        if (!activeRoomsContainer) return;

        if (!rooms.length) {
            activeRoomsContainer.innerHTML = '<p>No active rooms available.</p>';
            return;
        }

        activeRoomsContainer.innerHTML = rooms.map(room => `
            <div class="room-card">
                <div class="room-card-body">
                    <h3>${room.name}</h3>
                    <div class="room-info">
                        <span>Created by: ${room.createdBy.displayName || room.createdBy.username}</span>
                        <span class="participants-count">
                            <i class="fas fa-users"></i> ${room.participantCount}
                        </span>
                    </div>
                    <div class="room-info">
                        <span>Status: ${room.status}</span>
                        ${room.isPrivate ? '<span class="private-badge"><i class="fas fa-lock"></i> Private</span>' : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-block" onclick="joinRoom('${room.id}')">
                        Join Room
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Create Room
    window.createRoom = async function(name, isPrivate = false, password = null) {
        if (!Auth.isAuthenticated()) {
            toast.error('Please login to create a room');
            return;
        }

        try {
            const response = await fetch(`${window.CONFIG.API_URL}/room/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ name, isPrivate, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create room');
            }

            const { room } = await response.json();
            toast.success('Room created successfully');
            window.location.href = `/meeting.html?roomId=${room.id}`;
        } catch (error) {
            console.error('Failed to create room:', error);
            toast.error(error.message || 'Failed to create room');
        }
    };

    // Join Room
    window.joinRoom = async function(roomId, password = null) {
        if (!Auth.isAuthenticated()) {
            toast.error('Please login to join a room');
            return;
        }

        try {
            const response = await fetch(`${window.CONFIG.API_URL}/room/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.requiresPassword) {
                    showRoomPasswordModal(roomId);
                    return;
                }
                throw new Error(data.message || 'Failed to join room');
            }

            const { room } = await response.json();
            window.location.href = `/meeting.html?roomId=${room.id}`;
        } catch (error) {
            console.error('Failed to join room:', error);
            toast.error(error.message || 'Failed to join room');
        }
    };

    // Initialize
    Auth.checkStatus().then(({ isAuthenticated }) => {
        if (isAuthenticated) {
            fetchActiveRooms();
        }
    });
});

// Modal Functions
function showCreateRoomModal() {
    createRoomModal.style.display = 'block';
}

function showRoomPasswordModal(roomId) {
    currentPasswordProtectedRoom = roomId;
    roomPasswordModal.style.display = 'block';
}

// Close modals when clicking the close button or outside the modal
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        createRoomModal.style.display = 'none';
        roomPasswordModal.style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target === createRoomModal) {
        createRoomModal.style.display = 'none';
    }
    if (event.target === roomPasswordModal) {
        roomPasswordModal.style.display = 'none';
    }
});

// Show/hide password field based on private checkbox
isPrivateCheckbox.addEventListener('change', () => {
    passwordGroup.style.display = isPrivateCheckbox.checked ? 'block' : 'none';
});

// Create room form submission
createRoomSubmitBtn.addEventListener('click', () => {
    const name = roomNameInput.value.trim();
    const isPrivate = isPrivateCheckbox.checked;
    const password = isPrivate ? createRoomPasswordInput.value.trim() : null;

    if (!name) {
        toast.error('Please enter a room name');
        return;
    }

    if (isPrivate && !password) {
        toast.error('Please enter a password for private room');
        return;
    }

    createRoom(name, isPrivate, password);
    createRoomModal.style.display = 'none';
});

// Join room with password
submitPasswordBtn.addEventListener('click', () => {
    const password = roomPasswordInput.value.trim();
    if (!password) {
        toast.error('Please enter the room password');
        return;
    }

    joinRoom(currentPasswordProtectedRoom, password);
    roomPasswordModal.style.display = 'none';
});