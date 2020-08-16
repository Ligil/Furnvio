// import { Json } from "sequelize/types/lib/utils";
// this is for navbar
$('#autoComplete').on('click', function(){
    if (document.getElementById("searchInput").value.length > 0){
        document.getElementById('search-div').style.display = 'block'
        $("#overlay").css("display", "block");
    }
});

// $('#autoComplete').on('', function(){
//     document.getElementById('search-div').style.display = 'none'
//     $("#overlay").css("display", "none");
// });

$(document).mouseup(function(e) 
{
    var container = $("autoComplete");
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) 
    {
        document.getElementById('search-div').style.display = 'none'
        $("#overlay").css("display", "none");
    }
});


function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, original=str,  index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) { //when found
        originalString = original.substring(index, index+searchStrLen) //original casing
        indices.push([index, originalString, index+searchStrLen]); //add index
        startIndex = index + searchStrLen; //search next
    }
    return indices;
}

$('#searchInput').on('keyup', function(){
    let searchInput = {searchInput: document.getElementById("searchInput").value.split(' ')}
    //remove empty strings when splitting
    searchInput.searchInput = searchInput.searchInput.filter(function(searchValue){
        return (searchValue != '')
    }) //get search value

    if (document.getElementById("searchInput").value.length > 0){
        document.getElementById('search-div').style.display = 'block'
        $("#overlay").css("display", "block");
    } else {
        document.getElementById('search-div').style.display = 'none'
        $("#overlay").css("display", "none");
    }

    productsDiv = document.getElementById('search-products-items')
    categoriesDiv = document.getElementById('search-category-items')
    //categories, products
    //no category found 
    fetch('/searchValue', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(searchInput)
    }).then((res)=>{
        res.json().then((data) => {
            furnitureData = data['furniture']
            categoryData = data['category']
            productsDiv.innerHTML = ''
            categoriesDiv.innerHTML = ''
            //Section 1: Making Category Tabs

            if (furnitureData == []){furnitureData = ['']}
            if (categoryData == []){categoryData = ['']}

            var searchData = searchInput.searchInput
            if (categoryData.length != 0){
                categoryData.forEach((category)=>{
                    /*Make the matching letters bold:*/
                    var boldedText = category                    
                    for (i in searchData){
                        word = searchData[i]
                        if (boldedText.toLowerCase().startsWith(word.toLowerCase())){
                            boldedText = "<b class='font-weight-bold'>" + boldedText.substring(0, word.length) + "</b>" + boldedText.substring(word.length)
                            break
                        }
                    }                     

                    eachItem = document.createElement("DIV"); //each item
                    eachItem.classList.add("align-items-center")
                    eachItem.classList.add("search-items-each")

                    textContainer = "<div class='search-items-text'>" + boldedText + "</div>"
                    eachItem.innerHTML = textContainer

                    //Link it
                    eachItemLink = document.createElement("a");
                    eachItemLink.setAttribute("href", "/furniture/"+category)
                    eachItemLink.appendChild(eachItem)

                    //Append it
                    categoriesDiv.appendChild(eachItemLink);
                })

            } else {  
                eachItem = document.createElement("DIV");
                eachItem.classList.add("search-items-each")
                eachItem.innerHTML = "<strong>No category found</strong>";
                categoriesDiv.appendChild(eachItem);
            }

            //Section 2: Making furniture tabs
            searchCounter = document.getElementById("search-seeAll");
            if (furnitureData.length != 0){
                furnitureData.forEach((object)=>{

                    /*Make the matching letters bold:*/
                    //Part 1: getting data
                    var boldedTest = object.furnitureName

                    var word, allIndexes = []
                    for (i in searchData){
                        searchLength = searchData[i].length
                        word = searchData[i]
                        allIndexes = allIndexes.concat(getIndicesOf(word, boldedTest))
                    } 
                    allIndexes = allIndexes.sort(function(arrayOne, arrayTwo) { return arrayOne[0]-arrayTwo[0]} ) //sorted array of all data
                    
                    //Part 2: combining parts
                    var indexPart2 = 0, newArray = []
                    while (indexPart2 < (allIndexes.length)-1 ){
                        if (allIndexes[indexPart2][2] > allIndexes[indexPart2+1][0]){ //if end index > start index (which means combine)
                            if (allIndexes[indexPart2[2] >= allIndexes[indexPart2+1][2]]){ // if contained e.g search = Hello ello
                                //No change, remove second index
                                allIndexes = allIndexes.splice(indexPart2+1, 1)
                            } else { //if not contained e.g search = Hello lover
                                //combine them
                                newArray = [allIndexes[indexPart2][0],
                                allIndexes[indexPart2][1].substring( allIndexes[indexPart2][0], allIndexes[indexPart2+1][0] ) + allIndexes[indexPart2+1][1],
                                allIndexes[indexPart2+1][2]] //create new Array
                                // allIndexes = allIndexes.splice(indexPart2, 2, newArray) //remove first two, replace array
                                allIndexes.splice(indexPart2, 2, newArray)
                            }
                        } else { //if no need change, move on
                            indexPart2 += 1
                        }
                    }

                    //Part 3: replacing parts
                    var singleArray=[], part3Counter = 0
                    for (i in allIndexes){
                        singleArray = allIndexes[i]
                        boldedTest = boldedTest.substring(0, singleArray[0]+(part3Counter*32)) + "<b class='font-weight-bold'>" + singleArray[1] + "</b>" + boldedTest.substring(singleArray[2]+(part3Counter*32)) 
                        part3Counter += 1
                    }

                    //28 and 4
                    //boldedTest is the new bolded text, b is a div in search-div

                    eachItem = document.createElement("DIV"); //each item
                    eachItem.classList.add("d-flex")
                    eachItem.classList.add("align-items-center")
                    eachItem.classList.add("search-items-each")


                    //add image and text
                    image = "<img src='" + object.imageURL + "' alt='' style='max-width: 100%; max-height: 100%'>"
                    imageContainer = "<div class='col-3'>" + image + "</div>"
                    textContainer = "<div class='col-9 search-items-text'>" + boldedTest + "</div>"
                    eachItem.innerHTML = imageContainer + textContainer
                    eachItemLink = document.createElement("a"); //each item
                    eachItemLink.setAttribute("href", "/furniture/item/"+object.id)
                    eachItemLink.appendChild(eachItem)
                    productsDiv.appendChild(eachItemLink);

                    //counter at bottom
                    searchCounter.value = "See all (" + data['furnitureCount'] + ") results matching '" + document.getElementById("searchInput").value +"'"
                })

            } else {  
                eachItem = document.createElement("DIV");
                eachItem.classList.add("search-items-each")
                eachItem.innerHTML = "<strong>No items found</strong>";
                productsDiv.appendChild(eachItem);

                searchCounter.value = "No Results"
            }

        })
    });
    //func end
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

$("#themes-dropdown, #themes-dropdown-content").on({
    'mouseenter': function(){
        $("#themes-dropdown-content").css("display", "block");
        $("#overlay").css("display", "block");
    }, 
    'mouseleave': function(){
        $("#themes-dropdown-content").css("display", "none")
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

$('#reviewImageUpload').on('change', function(){
    let image = $("#reviewImageUpload")[0].files[0];
    let formdata = new FormData();
    formdata.append('reviewImageUpload', image);
    $.ajax({
        url: '/furniture/reviewUpload',
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

$('#themeUpload').on('change', function(){
    let image = $("#themeUpload")[0].files[0];
    let formdata = new FormData();
    formdata.append('themeUpload', image);
    $.ajax({
        url: '/admin/themeUpload',
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

$('#categoryUpload').on('change', function(){
    let image = $("#categoryUpload")[0].files[0];
    let formdata = new FormData();
    formdata.append('categoryUpload', image);
    $.ajax({
        url: '/admin/categoryUpload',
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



$('#disCodeB').on('click', function(){
    let disCode = {disCode: document.getElementById("disCode").value}
    console.log(disCode)
    fetch('http://localhost:5000/payment/checkDis', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(disCode)
    }).then((res)=>{
        res.json().then((data) => {
            if(data['response'] == 2){
                document.getElementById('disCodeN').style.display = 'none'
                document.getElementById('disCodeW').style.display = ''
            } else {
                if(data['response'] == 0){
                    document.getElementById('disCodeW').style.display = 'none'
                    document.getElementById('disCodeN').style.display = ''
                } else {
                    document.getElementById('disCodeN').style.display = 'none'
                    document.getElementById('disCodeW').style.display = 'none'
                    location.reload()
                }
            }
        })
    })
})

