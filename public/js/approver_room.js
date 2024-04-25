// get user
async function getUser() {
    try {
        const response = await fetch('/userInfo');
        if (response.ok) {
            const data = await response.json();
            document.querySelector('#useremail').textContent = data.useremail;
        }
        else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// get room from database
async function getRoom() {
    try {
        const response = await fetch('/user/room');
        if (response.ok) {
            const data = await response.json();
            showRoom(data);
        }
        else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

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
        temp += `</tr>`;
    });
    table.innerHTML += temp;
}

// get user info
getUser();

// get and show rooom
getRoom();