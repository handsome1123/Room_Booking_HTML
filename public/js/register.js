const formRegister = document.querySelector('#formRegister');
formRegister.onsubmit = async function (e) {
    e.preventDefault();
    const regUsername = formRegister['regUsername'].value;
    const regEmail    = formRegister['regEmail'].value;
    const regPassword = formRegister['regPassword'].value;
    try {
        const options = {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "username": regUsername,
                "useremail": regEmail,
                "password": regPassword
            }),
        };
        const response = await fetch('/register', options);
        if (response.ok) {
            const data = await response.text();
            Notiflix.Report.success('Success', data, 'OK', 
            function cb() {
            location.replace(data);
        });
        }
        else if (response.status == 409) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error'); 
        }
    } catch (err) {
        console.error(err.message);
        // alert('Error: ' + err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}