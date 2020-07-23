// import { Json } from "sequelize/types/lib/utils";

// this is for navbar

$('#searchInput').on('focusin', function(){
    document.getElementById('search-div').style.display = 'block'
    $("#overlay").css("display", "block");
});

$('#searchInput').on('focusout', function(){
    document.getElementById('search-div').style.display = 'none'
    $("#overlay").css("display", "none");
});


$('#searchInput').on('keyup', function(){
    let searchInput = {searchInput: this.value.split(" ")}
    a = document.getElementById('search-div')
    a.style.display = 'block'

    fetch('/searchValue', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(searchInput),
    }).then((res)=>{
        res.json().then((data) => {
            
            a.innerHTML = ''
            if (data.length != 0){

                data.forEach((object)=>{
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    b.innerHTML = "<strong>" + object.furnitureName + "</strong>";

                    // b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    // b.innerHTML += arr[i].substr(val.length);

                    a.appendChild(b);
                })

            } else { 
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>-No items found-</strong>";
                a.appendChild(b);
            }

        })
    });
});

$("#feedback-dropdown, #feedback-dropdown-content").on({
    'mouseenter': function(){
        $("#feedback-dropdown-content").css("display", "block");
        $("#overlay").css("display", "block");
    }, 
    'mouseleave': function(){
        $("#feedback-dropdown-content").css("display", "none")
        $("#overlay").css("display", "none");
    }
})

$("#admin-function-dropdown, #admin-function-dropdown-content").on({
    'mouseenter': function(){
        $("#admin-function-dropdown-content").css("display", "block");
        $("#overlay").css("display", "block");
    }, 
    'mouseleave': function(){
        $("#admin-function-dropdown-content").css("display", "none")
        $("#overlay").css("display", "none");
    }
})

$("#admin-function-dropdown-content-furniture1, #admin-function-dropdown-content-furniture2").on({
    'mouseenter': function(){
        $("#admin-function-dropdown-content-furniture2").css("display", "block");
    }, 
    'mouseleave': function(){
        $("#admin-function-dropdown-content-furniture2").css("display", "none")
    }
})


//Cookie
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


//the rest
function GetURLParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}

function minimalChecked(){
    var languageArray = document.getElementById('languagesCheckbox').querySelectorAll("div");
    var checkedCounter = 0;
    for (i=0; i<languageArray.length; i++){
        if (languageArray[i].querySelector("input").checked){
            checkedCounter += 1;
        };
    };

    if (checkedCounter == 0){
        document.getElementById("butAddVideo").disabled = true;
        document.getElementById("languageErr").style.display = "block"
    } else{
        document.getElementById("butAddVideo").disabled = false;
        document.getElementById("languageErr").style.display = "none"
    }

}

function getOMdbMovie(){
    const title = document.getElementById('title').value;
    const poster = document.getElementById('poster');
    const omdbErr = document.getElementById('OMdbErr');
    const posterURL = document.getElementById('posterURL');
    const starring = document.getElementById('starring');
    const story = document.getElementById('story');
    const datepicker = document.getElementById('datepicker');

    fetch('https://www.omdbapi.com/?t=' + title + '&apikey=c8d95554')
    .then((res) => {
        return res.json();
    }).then((data) => { //data is the api thingy
        if (data.Response === 'False') { //say error
            poster.src = '/img/no-image.jpg';
            omdbErr.style.display = 'inline';
        } else {//change values
            omdbErr.style.display = 'none';
            poster.src = data.Poster;
            starring.value = data.Actors;
            posterURL.value = data.Poster; // hidden input field to submit
            story.value = data.Plot;
            datepicker.value = moment(new Date(data.Released)).format('DD/MM/YYYY');
        }
    }).catch(error => {omdbErr.innerHTML = error;})

}


function titleCase(element) {
    var sentence = element.value.toLowerCase().split(" ");
    for(var i = 0; i< sentence.length; i++){
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    element.value = sentence.join(" ");
    return sentence;
}

$('[data-toggle=confirmation]').confirmation({
    rootSelector: '[data-toggle=confirmation]',
});

$('#posterUpload').on('change', function(){
    let image = $("#posterUpload")[0].files[0];
    console.log(image)
    let formdata = new FormData();
    formdata.append('posterUpload', image);
    $.ajax({
        url: '/video/upload',
        type: 'POST',
        data: formdata,
        contentType: false,
        processData: false,
        'success':(data) => {
            $('#poster').attr('src', data.file);
            $('#posterURL').attr('value', data.file);// sets posterURL hidden field
            if(data.err){
                $('#posterErr').show();
                $('#posterErr').text(data.err.message);
            } else{
                $('#posterErr').hide();
            }
        }
    });
});


$('#imageUpload').on('change', function(){
    let image = $("#imageUpload")[0].files[0];
    console.log(image)
    let formdata = new FormData();
    formdata.append('imageUpload', image);
    $.ajax({
        url: '/admin/furnitureUpload',
        type: 'POST',
        data: formdata,
        contentType: false,
        processData: false,
        'success':(data) => {
            $('#image').attr('src', data.file);
            $('#imageURL').attr('value', data.file);// sets imageURL hidden field
            if(data.err){
                $('#imageErr').show();
                $('#imageErr').text(data.err.message);
            } else{
                $('#imageErr').hide();
            }
        }
    });
});
