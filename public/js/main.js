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

    var bearEntry = document.createElement("input");
    bearEntry.setAttribute('type', 'text');
    bearEntry.setAttribute('value', 'default');
    bearEntry.setAttribute('id', 'bearinput');


    document.getElementById('first').appendChild(bearEntry);

    var bearButton = document.createElement("button");
    bearButton.setAttribute("type", "submit");

    bearButton.addEventListener('click', function() {
        console.log(document.getElementById('bearinput').value);

        var payload = {
            author: document.getElementById('bearinput').value
        };

          fetch("/api/blog", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }).then((res) => {
            console.log('res');
             return res.json()})
        .then((data) => {
            document.getElementById('sixth').innerHTML = JSON.stringify(data);
            }).catch(function (e) {
                document.getElementById('fourth').innerHTML = e;
            });
    });

    document.getElementById('first').appendChild(bearButton);








    
    var elem = document.createElement("img");

    elem.src = 'images/testimage.jpg';

    document.getElementById("second").appendChild(elem);

    // fetch('http://localhost:4000/api/bea/5a3c4134b5f523b1617c60ed')
    // .then((res) => { return res.json()})
    // .then((data) => { 
    //     document.getElementById('third').innerHTML = JSON.stringify(data);
    //     }).catch(function (e) {
    //         document.getElementById('third').innerHTML = e;
    //     });


        fetch('http://localhost:4000/api/bear/5a3c38300245d4af96ec7173')
    .then((res) => {
        console.log('res');
         return res.json()})
    .then((data) => {
        document.getElementById('fourth').innerHTML = JSON.stringify(data);
        }).catch(function (e) {
            document.getElementById('fourth').innerHTML = e;
        });

        fetch('http://localhost:4000/api/blog')
        .then((res) => { return res.json()})
        .then((data) => { 
            document.getElementById('fifth').innerHTML = JSON.stringify(data);
            }).catch(function (e) {
                document.getElementById('fifth').innerHTML = e;
            });



            // var request = new Request('http://localhost:4000/api/bear/5a3a6e0b88d81d72a6600f43', {
            //     method: 'DELETE', 
            //     mode: 'cors', 
            //     redirect: 'follow',
            //     headers: new Headers({
            //         'Content-Type': 'text/json'
            //     })
            // });
            
            // // Now use it!
            // setTimeout(function() {
            //     fetch(request);
            // }, 3000);


            


       

    // fetch('http://localhost:4000/api/bears').then(function(myres) {
    //     console.log('myres: ', myres);
    //     //document.getElementById('third').innerHTML = myres[0].name;
    // });

    
    



}, false);


