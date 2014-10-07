/**
 * people database library
 * Dani Crepsxo (C) 2014
 *
 * Plugins used
 * Base 63 encoding:
 * http://plugins.jquery.com/base64/
 *
 */


var with_diff = 5;
var _current_id = null;

var people_list = null;

/**
 * Clear all screen elements. To use when performing any action
 */
function clearScreen() {
    $("#list").empty();
    $("#list-contents").hide();
    $('#form_person').hide();


}

function loading(on) {
    if (on)
        $("#ajax_loader").show();
    else
        $("#ajax_loader").hide();
}

/**
 * General initialization of the page
 */
function init() {
    $('#form_person').hide();

    document.getElementById('files').addEventListener('change', handleFileSelect, false);


    $(".confirm").confirm({
        text: "Really delete item?",
        title: "Confirmation required",
        confirm: function (button) {
            deletePerson();
        },
        cancel: function (button) {
            console.log('Deletion cancelled');
        },
        confirmButton: "Yes",
        cancelButton: "Cancel",
        post: true
    });

    loading(false);
}


// List all people
function getPeople() {
    loading(true);

    $('#lnk_people').attr('class', 'active');

    // GEt from database
    dbSelect('people', null, getPeopleCallback)
}

/**
 * Utily function to sort an array, based on name
 * @param {Type} a
 * @param {Type} b
 */
function SortByName(a, b) {
    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

// Callback to display details of persons details arrived
function getPeopleCallback() {
    clearScreen();

    console.log("getPeopleCallback executed");

    var data = RETRIEVED_DATA;
    data.sort(SortByName);

    // Cache people list to fill combos
    people_list = data;

    console.log('Retrieved ' + data.length + ' entries');


    for (var i = 0; i < data.length; i++) {
        var media = $('<div/>').addClass('media').addClass('results').attr('onclick', 'viewPerson(' + data[i].id + ')');
        var a = $('<a/>').addClass('pull-left').attr('href', '#');

        var image = $('<img/>').attr("src", data[i].picture).attr("width", "64").attr("height", "64");
        a.append(image);
        media.append(a);

        var media_body = $('<div/>').addClass('media-body');
        var title = $('<h3/>').addClass('media-heading').text(data[i].name + ' ' + data[i].surname);
        media_body.append(title);
        media_body.append($('<h5/>').addClass('media-heading').text(data[i].cargo));
        //var short_text = jQuery.trim(data[i].notes).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
        var text = $('<div/>').text(data[i].notes);
        media_body.append(text);
        media.append(media_body);

        $("#list").append(media);
    }
    $("#list-contents").show();
    loading(false);

}


// Display details for a especified person
function viewPerson(id) {
    loading(true);

    dbSelect('people', id, viewPersonCallBack)
}

// This is the callback function when teh data regarding a person arrives
function viewPersonCallBack() {
    clearScreen();
    console.log("viewPersonCallBack executed");

    var person = RETRIEVED_DATA;

    // Fill people to reports combo
    fillPeopleCombo();

    // Show edit form
    $('#form_person').show();

    //$('#imgPerson').attr('src',  "data:image/png;charset=utf-8;base64," + person.picture).attr("width", "128").attr("height", "128");
    _current_id = person.id;
    $('#imgPerson').attr('src', person.picture).attr("width", "128").attr("height", "128");
    $('#txtName').val(person.name);
    $('#txtSurname').val(person.surname);
    $('#txtEmail').val(person.email);
    $('#txtNotes').val(person.notes);
    $('#txtCargo').val(person.cargo);
    $('#txtTimeOnJob').val(person.timeonjob);
    $('#cmbReports').val(person.reportsto);


    loading(false);
}



function savePerson() {
    loading(true);
    console.log('savePerson() invoked');

    // Save values to person
    //var person = new Person() RETRIEVED_DATA;
    var person = new Object();

    person.id = _current_id;
    person.name = $('#txtName').val();
    person.surname = $('#txtSurname').val();
    person.email = $('#txtEmail').val();
    person.notes = $('#txtNotes').val();
    person.picture = $('#imgPerson').attr('src');
    person.cargo = $('#txtCargo').val();
    person.timeonjob = $('#txtTimeOnJob').val();
    person.reportsto = $('#cmbReports').val();

    doUpdate('people', person, savePersonCallback);
}

function savePersonCallback() {
    loading(false);
    console.log('savePersonCallback() executed');

    // Notify
    $('.top-left').notify({
        message: {
            text: 'Correctly saved!'
        }
    }).show(); // for the ones that aren't closable and don't fade out there is a .hide() function.

    getPeople();
}


/**
 * Function that activates when a file is uploaded to the control
 * @param {Type} evt
 */
function handleFileSelect(evt) {
    files = evt.target.files; // FileList object

    console.log(files);

    // Check file type
    if ((files[0].type != 'image/png') && (files[0].type != 'image/jpeg')) {
        $('.top-left').notify({
            message: {
                text: 'Please uplaod only png file types!',
                type: 'warning'
            }
        }).show();

        loading(false);
        return;
    }

    // Read the file and set it as image data
    var reader = new FileReader();
    reader.onload = function (event) {
        $('#imgPerson').attr('src', event.target.result);

    };

    reader.onerror = function (event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };


    // Read in the image file as a data URL.
    console.log('antes de leer');
    reader.readAsDataURL(files[0]);
}

function fillPeopleCombo() {
    if (people_list == null)
        return;

    // Fill people to reports combo
    var combo = $('#cmbReports');
    combo.empty();
    combo.append(new Option('(select one)', ''));
    $.each(people_list, function () {
        combo.append(new Option(this.name + ' ' + this.surname + ' (' + this.cargo + ')', this.id));
    });

}


function newPerson() {
    clearScreen();
    console.log("newPerson executed");

    $('.form-control').val('');
    $('#imgPerson').attr('src', 'img/no_image.gif');
    fillPeopleCombo();

    // Show edit form
    $('#form_person').show();
    _current_id = null;

}


function deletePerson() {
    console.log("deletePerson");
    dbDelete('people', _current_id, deletePersonCallback);
}

function deletePersonCallback() {
    clearScreen();
    console.log('Person deleted');

    // Notify
    $('.top-left').notify({
        message: {
            text: 'Succesfully deleted!'
        }
    }).show(); // for the ones that aren't closable and don't fade out there is a .hide() function.

    getPeople();
}