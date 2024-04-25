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
// function showRoom(data) {
//     const table = document.getElementById('timeSlotsTable');
//     let temp = '';
//     data.forEach(function(slot) {
//         temp += `<tr>`;
//         temp += `<td>${slot.slot_id}</td>`;
//         temp += `<td>${slot.start_time}</td>`;
//         temp += `<td>${slot.end_time}</td>`;
//         temp += `<td>${slot.room_name}</td>`;
//         if (slot.status === 'free') {
//             temp += `<td>${slot.status}</td>`;
//             temp += `<td><button class="btn btn-success" onclick="openBookSlotModal(${slot.slot_id}, '${slot.room_id}', '${slot.room_name}', '${slot.start_time}', '${slot.end_time}')">Book</button></td>`;
//         } else {
//             temp += `<td>${slot.status}</td>`;
//             temp += `<td></td>`;
//         }
//         temp += `</tr>`;
//     });
//     table.innerHTML += temp;
// }

function showRoom(data) {
    const table = document.getElementById('timeSlotsTable');
    let temp = '';
    let uniqueRooms = {};

    // Group time slots by room
    data.forEach(function(slot) {
        if (!uniqueRooms[slot.room_id]) {
            uniqueRooms[slot.room_id] = [];
        }
        uniqueRooms[slot.room_id].push(slot);
    });

    // Display each room's time slots
    for (const roomId in uniqueRooms) {
        const room = uniqueRooms[roomId];
        temp += `<div class="row">`;
        temp += `<div class="col-md-3"><img src="/public/img/${room[0].image_path}" alt="${room[0].room_name}" style="max-width: 100px; max-height: 100px;"></div>`; // Display room image
        temp += `<div class="col-md-3">${room[0].room_name}</div>`; // Display room name only once
        temp += `<div class="col-md-3">Time Slots</div>`; // Column for time slots
        temp += `<div class="col-md-3">Status</div>`; // Column for status
        temp += `</div>`;
        room.forEach(function(slot) {
            temp += `<div class="row">`;
            temp += `<div class="col-md-3"></div>`; // Empty column for room image
            temp += `<div class="col-md-3"></div>`; // Empty column for room image
            temp += `<div class="col-md-3">${slot.start_time} - ${slot.end_time}</div>`; // Display time slot
            temp += `<div class="col-md-3">`; // Column for action
            if (slot.status === 'free') {
                temp += `<button class="btn btn-success" onclick="openBookSlotModal(${slot.slot_id}, '${slot.room_id}', '${slot.room_name}', '${slot.start_time}', '${slot.end_time}')">${slot.status}</button>`;
            }
            else{
                temp += `<button class="btn btn-secondary" >${slot.status}</button>`;
            }
            temp += `</div>`;
            temp += `</div>`; // Close row
        });
    }

    table.innerHTML = temp; // Replace innerHTML to avoid appending duplicate content
}





// Function open modal 
function openBookSlotModal(slotId, roomId, roomName, startTime, endTime) {
    const modal = document.getElementById('bookSlotModal');
    const slotDetails = document.getElementById('slotDetails');
    slotDetails.innerText = `You are about to book the slot: ${slotId}\nRoom: ${roomName}\nStart Time: ${startTime}\nEnd Time: ${endTime}`;
    $(modal).modal('show');
    modal.dataset.slotId = slotId;
    modal.dataset.roomId = roomId;
    modal.dataset.startTime = startTime;
    modal.dataset.endTime = endTime;
}

// function confirmBooking
async function confirmBooking() {
    const slotId = document.getElementById('bookSlotModal').dataset.slotId;
    const roomId = document.getElementById('bookSlotModal').dataset.roomId;
    const startTime = document.getElementById('bookSlotModal').dataset.startTime;
    const endTime = document.getElementById('bookSlotModal').dataset.endTime;
    const bookingObjective = document.getElementById('bookingObjective').value;
    Notiflix.Confirm.show('Confirm', 'Confirm this booking?', 'Yes', 'No',
        async function okCb() {
            try {
                const options = {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId,
                        startTime,
                        endTime,
                        bookingObjective
                    }),
                };
                const response = await fetch(`/user/book-slot/${slotId}`, options);
                if (response.ok) {
                    const data = await response.text();
                    Notiflix.Report.success('Success', data, 'OK',
                        function cb() {
                            window.location.reload();
                        });
                }
                else if (response.status == 500) {
                    const data = await response.text();
                    throw Error(data);
                }
                else {
                    const data = await response.text()
                    // throw Error('Connection error1');
                    throw Error(`Error: ${response.status} - ${response.statusText} - ${data}`);

                }
            } catch (err) {
                console.error(err.message);
                Notiflix.Report.failure('Error', err.message, 'Close');
            } finally {
                $('#bookSlotModal').modal('hide');
            }
        });
}




// get user info
getUser();

// get and show rooom
getRoom();