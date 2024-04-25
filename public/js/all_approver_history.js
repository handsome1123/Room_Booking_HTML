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

// get request list from database
async function getBooking() {
    try {
        const response = await fetch('/staff/all-approvers-history');
        if (response.ok) {
            const data = await response.json();
            showBooking(data);
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

// show booking history table
function showBooking(data) {
    const tbody = document.querySelector('#tbody');
    let temp = '';
    data.forEach(function(request) {
        temp += `<tr>`;
        temp += `<td>${request.id}</td>`;
        temp += `<td>${new Date(request.date).toLocaleDateString()}</td>`;
        temp += `<td>${request.start_time}</td>`;
        temp += `<td>${request.end_time}</td>`;
        temp += `<td>${request.room_name}</td>`;
        temp += `<td>${request.student_name || ''}</td>`;
        temp += `<td>${request.objective}</td>`;
        temp += `<td>${request.status}</td>`;
        temp += `<td>${request.lecturer_name || ''}</td>`;
        temp += `</tr>`;
    });
    tbody.innerHTML = temp;
}

// get booking
getBooking();

// Initial fetch of User and Room
getUser();