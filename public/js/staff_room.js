// show room table
function showRoom(data) {
    const table = document.getElementById('timeSlotsTable');
    let temp = '';
    data.forEach(function(slot) {
        temp += `<tr>`;
        temp += `<td>${slot.slot_id}</td>`;
        temp += `<td>${slot.start_time}</td>`;
        temp += `<td>${slot.end_time}</td>`;
        temp += `<td>${slot.room_name}</td>`;
        temp += `<td>${slot.status}</td>`;
        if (slot.status === 'free') {
            temp += `<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" onchange="confirm(event, ${slot.slot_id}, 'free')" checked></div></td>`;
        } else if (slot.status === 'disabled') {
            temp += `<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" onchange="confirm(event, ${slot.slot_id}, 'disabled')"></div></td>`;
        } else {
            temp += `<td></td>`; // Empty cell for 'pending' and 'reserved' slots
        }
        temp += `</tr>`;
    });
    table.innerHTML = temp;
}

// confirm change slot status
function confirm(cb, pid, currentStatus) {
    const check = cb.target.checked;
    let message = 'Enable slot?';
    if (!check) {
        message = 'Disable slot?';
    }
    Notiflix.Confirm.show('Confirm', message, 'Yes', 'No', 
        function okCb() {
            enableSlot(pid, check, currentStatus);
        },
        function cancelCb() {
            cb.target.checked = !check;
        }
    );
}

// enable/disable slot
async function enableSlot(pid, check, currentStatus) {
    let newStatus = check ? (currentStatus === 'free' ? 'disabled' : 'free') : 'disabled';
    try {
        const response = await fetch(`/staff/time-slot/${pid}/${newStatus}`, { method: 'PUT' });
        if (response.ok) {
            const data = await response.text();
            Notiflix.Report.success('Success', 'Slot status updated successfully.', 'OK');
            fetchRoom(); // Refresh the slots after the status is updated
        } else if (response.status === 500) {
            const data = await response.text();
            throw Error(data);
        } else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// Fetch Room
async function fetchRoom() {
    try {
        const response = await fetch('/user/room');
        if (response.ok) {
            const data = await response.json();
            showRoom(data);
        } else {
            throw Error('Failed to fetch room');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// get user info
async function getUser() {
    try {
        const response = await fetch('/userInfo');
        if (response.ok) {
            const data = await response.json();
            document.querySelector('#useremail').textContent = data.useremail;
        } else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        } else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// get and show room
async function getRoom() {
    try {
        const response = await fetch('/user/room');
        if (response.ok) {
            const data = await response.json();
            showRoom(data);
        } else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        } else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// Fetch Room
async function fetchRoom() {
    try {
        const response = await fetch('/user/room');
        if (response.ok) {
            const data = await response.json();
            showRoom(data);
        } else {
            throw Error('Failed to fetch room');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// Initial fetch of User and Room
getUser();
getRoom();
