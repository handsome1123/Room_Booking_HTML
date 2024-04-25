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

// get request list from database
async function getBooking() {
    try {
        const response = await fetch('/user/history');
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

// show product table
function showBooking(data) {
    const tbody = document.querySelector('#tbody');
    let temp = '';
    data.forEach(function(request) {
        temp += `<tr>`;
        temp += `<td>${request.id}</td>`;
        temp += `<td>${new Date(request.date).toLocaleDateString()}</td>`;
        temp += `<td>${request.room_name}</td>`;
        temp += `<td>${request.start_time}-${request.end_time}</td>`;
        temp += `<td>${request.objective}</td>`;
        temp += `<td>${request.status}</td>`;
    });
    tbody.innerHTML = temp;
}

// get user info
getUser();

// get booking
getBooking();