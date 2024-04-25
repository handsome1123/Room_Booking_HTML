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

// Fetch time slot data
async function getTimeSlots() {
    try {
        const response = await fetch('/staff/timeslots');
        if (response.ok) {
            const data = await response.json();
            showTimeSlots(data);
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


// Show time slots table
function showTimeSlots(data) {
    const tbody = document.querySelector('#tbody');
    let temp = '';
    const { totalSlots, freeSlots, pendingSlots, reservedSlots, disabledSlots } = data[0];

    temp += `<tr><td>Total Slots</td><td>${totalSlots}</td></tr>`;
    temp += `<tr><td>Free Slots</td><td>${freeSlots}</td></tr>`;
    temp += `<tr><td>Pending Slots</td><td>${pendingSlots}</td></tr>`;
    temp += `<tr><td>Reserved Slots</td><td>${reservedSlots}</td></tr>`;
    temp += `<tr><td>Disabled Slots</td><td>${disabledSlots}</td></tr>`;

    tbody.innerHTML = temp;
}


// get user info
getUser();

// get room timeslots counts
getTimeSlots();
