document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("first").innerHTML = '<h1>Paragraph changed!</h1>';
    console.log("YO!!!!");

    // fetch('/images/testimage.jpg')
	// .then(function(response) {
    //     console.log("hej!!!!");
	//   return response.blob();
	// })
	// .then(function(imageBlob) {
    //     document.getElementById("second").src = URL.createObjectURL(imageBlob);
    // });
    
    var elem = document.createElement("img");

    elem.src = 'images/testimage.jpg';

    document.getElementById("second").appendChild(elem);

    fetch('http://localhost:4000/api/bears/5a3c4134b5f523b1617c60ed')
    .then((res) => { return res.json()})
    .then((data) => { /*
        let result = '<h2> Users Info </h2>';
        data.forEach((user) => {
            result +=
             `<h4> User ID: ${user.id} </h4>
             <ul>
               <li> User tittle : ${user.name}</li>
               <li> User body : ${user.body} </li>
            </ul>
             `;*/
        document.getElementById('third').innerHTML = JSON.stringify(data);
        });


        fetch('http://localhost:4000/api/bears/5a3c38300245d4af96ec7173')
    .then((res) => { return res.json()})
    .then((data) => { /*
        let result = '<h2> Users Info </h2>';
        data.forEach((user) => {
            result +=
             `<h4> User ID: ${user.id} </h4>
             <ul>
               <li> User tittle : ${user.name}</li>
               <li> User body : ${user.body} </li>
            </ul>
             `;*/
        document.getElementById('fourth').innerHTML = JSON.stringify(data);
        });

        fetch('http://localhost:4000/api/bears')
        .then((res) => { return res.json()})
        .then((data) => { /*
            let result = '<h2> Users Info </h2>';
            data.forEach((user) => {
                result +=
                 `<h4> User ID: ${user.id} </h4>
                 <ul>
                   <li> User tittle : ${user.name}</li>
                   <li> User body : ${user.body} </li>
                </ul>
                 `;*/
            document.getElementById('fifth').innerHTML = JSON.stringify(data);
            });



            var request = new Request('http://localhost:4000/api/bears/5a3a6e0b88d81d72a6600f43', {
                method: 'DELETE', 
                mode: 'cors', 
                redirect: 'follow',
                headers: new Headers({
                    'Content-Type': 'text/json'
                })
            });
            
            // Now use it!
            setTimeout(function() {
                fetch(request);
            }, 3000);


            


       

    // fetch('http://localhost:4000/api/bears').then(function(myres) {
    //     console.log('myres: ', myres);
    //     //document.getElementById('third').innerHTML = myres[0].name;
    // });

    
    



}, false);


