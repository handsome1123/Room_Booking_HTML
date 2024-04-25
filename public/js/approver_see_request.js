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
        const response = await fetch('/approver/user-requests');
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
        temp += `<td>${request.start_time}</td>`;
        temp += `<td>${request.end_time}</td>`;
        temp += `<td>${request.username}</td>`;
        temp += `<td>${request.email}</td>`;
        temp += `<td>${request.objective}</td>`;
        temp += `<td>${request.status}</td>`;
        temp += `<td><button class="btn btn-success" onclick="approve(${request.id})">Approve</button></td>`;
        temp += `<td><button class="btn btn-danger" onclick="reject(${request.id})">Reject</button></td>`;
        temp += `</tr>`;
    });
    tbody.innerHTML = temp;
}

// approve booking request function
function approve(id) {
    Notiflix.Confirm.show('Confirm', 'Confirm this request?', 'Yes', 'No', 
        async function okCb() {
            try {
                const response = await fetch(`/approver/approve/${id}`, {method: 'PUT'});
                if (response.ok) {
                    const data = await response.text();
                    Notiflix.Report.success('Success', data, 'OK', 
                        function cb() {
                            // reload page
                            getBooking();
                            // TODO: refresh or disable table product detail
                        }
                    );
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
    );
}

// approve booking request function
function reject(id) {
    Notiflix.Confirm.show('Confirm', 'Reject this request?', 'Yes', 'No', 
        async function okCb() {
            try {
                const response = await fetch(`/approver/reject/${id}`, {method: 'PUT'});
                if (response.ok) {
                    const data = await response.text();
                    Notiflix.Report.success('Success', data, 'OK', 
                        function cb() {
                            // reload page
                            getBooking();
                            // TODO: refresh or disable table product detail
                        }
                    );
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
    );
}

// get booking
getBooking();

// get user info
getUser();