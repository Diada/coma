/**
 * COMA Framework
 */

/*********************************************************************************/
/**                              Global parameters                              **/
var lang = 'es';
var Business = null;

/** 
 * Errors definintion
 *
 * all functions must implement try..catch structures. In the cath a message alert will be displayed to the user.
 * the text of the message will be the constant and the language.
 */

var E0001_es = 'El formulario $1 no tiene definido el atributo "object". No se puede saber sobre que elemento se está realizando la operación';
var E0002_es = 'No se ha podido cargar el fichero business.xml';

function compose(errorId, param1) {
    var msg = eval(errorId + '_' + lang);
    msg = msg.replace('$1', param1);
    return msg;
}

/**
 * General initialization of the page
 */
function comaInit() {
    console.log('Initiating loading...');

    // Load XML file
    // Put jquery in synchronous mode lo control loading process
    jQuery.ajaxSetup({
        async: false
    });

    Business = null;

    jQuery.ajax({
        url: "business.xml",
        success: function (xml) {
            Business = xml;
        }
    }).fail(function () {
        throw compose('E0002', null);
    });

    // Put jquesy in asynchronous mode again
    jQuery.ajaxSetup({
        async: true
    });

    // Parse
    console.log('business.xml loaded: ' + Business);

    // For all <button> objects in the page, add the type="button" to avoid page reload
    $("button").attr("type", "button");
    console.log('Added type="button" on al <button> controls');


    console.log('Loading finished');
    loading(false);
}

/** For logging purposes
 * Global variables are used for instypection from Chome javascript console
 */
var e;
var current_object = null;

/**
 * This function is called from a search form, from its 'search' button.
 *
 * the funciton automatically:
 *  1. detects the type of BusinessOfbject we are searching
 *  2. Retrive the values fo the filters to build query
 *  3. Retrieves de data from the database
 *  4. Gives control to callback
 *
 * @param {Type} event
 */
function search(event) {
    try {
        loading(true);

        console.log('Search executed');

        // Get form and searched object
        e = event;
        var form_id = event.target.form.id;
        var object_name = $('#' + form_id).attr('object');
        current_object = object_name;

        if (object_name == null)
            throw compose('E0001', form_id);

        console.log('Search for object: ' + object_name);

        // Fet filters values
        var filters = $('#' + form_id).find('[id*=filter_]');
        var texts = $('#' + form_id).find(':text');
        var checkboxes = $('#' + form_id).find(':checkbox');
        var radios = $('#' + form_id).find(':radio');
        console.log('Detected filters: ' + filters.length + '. texts(' + texts.length + '), checkboxes(' + checkboxes.length + '), radios(' + radios.length + ')');

        // get tablename
        var table_name = $(Business).find('BusinessObject[name=' + object_name + ']').find('tablename').text();
        console.log('Table name localized for object: ' + table_name);

        // Prepare query
        var filters = new Array();
        var counter = 0;
        for (var i = 0; i < texts.length; i++) {
            if (texts[i].value == '')
                continue;

            var name = texts[i].id;
            name = name.substring(7, 30);
            filters[counter] = "{'" + name + "','taprox','" + texts[i].value + "'}";
            console.log('Adding filter: ' + filters[counter]);
            counter++;
        }

        // Launch query
        dbSelect(table_name, null, searchCallback, null, null, filters);

    } catch (e) {
        console.error(e);
    }
}


/**
 * Search Callback
 *
 * This function is invoked when we get the response form the server
 *
 * 1. Retrieve response (in JSON format)
 * 2.
 * @param {Type}
 */
function searchCallback() {

    console.log('searchCallback() executed');

    // Locate containing table
    var element_name = $(Business).find('BusinessObject[name=' + current_object + ']').find('tablename').text();
    $('#' + element_name + '_list_results').empty();

    // checks data is not null
    if (RETRIEVED_DATA == null || RETRIEVED_DATA.length == null) {
        console.log('Empty data returned. Exiting');
        loading(false);
        return;
    }

    // Saves retrieved data in local variable to avoid to happen to be rewriten during processing
    var data = RETRIEVED_DATA;

    // Check how many rows we have
    console.log('Retrieved ' + data.length + ' entries');
    if (data.length == 0) {
        console.log('No results. Exiting...');
        // TODO: message to user
        return;
    }

    // Create table to display results
    var table = document.createElement("table");
    table.id = element_name + '_results_table';

    var thead = document.createElement("thead");

    // Draw table header from business definition
    var feature_number = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature name').length;
    var business_features = new Array();

    // Append Id first pseudo-field
    business_features[0] = new BusinessFeature('Id', 'id', 1);

    var th = document.createElement("th");
    th.innerHTML = "Id";
    thead.appendChild(th);

    console.log('Creating header base on ' + feature_number + ' business features ');
    var header_log = '';
    var header_discarded = '';
    for (var i = 0; i < feature_number; i++) {
        // Retreive feature info
        var is_listed = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature displaylisted')[i].textContent;
        var feat_name = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature name')[i].textContent;
        var feat_field = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature fieldname')[i].textContent;

        var feature = new BusinessFeature(feat_name, feat_field, is_listed);
        business_features[i + 1] = feature;

        // If the Feature is indicated to be listed on the XML, display it on the table header
        if (!feature.isListed()) {
            header_discarded += '[ ' + feature.Name + ' ]';
            continue;
        }
        th = document.createElement("th");
        th.innerHTML = feature.Name;
        header_log += '[ ' + feature.Name + ' ]';
        thead.appendChild(th);
    }
    console.log(header_log);
    console.log('Discarded: ' + header_discarded);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    var retrieved_features = Object.keys(data[0]);
    console.log('There are ' + feature_number + ' features in business model');
    console.log('There are ' + retrieved_features.length + ' features in retrieved data');

    // Iterate throught data
    for (var i = 0; i < data.length; i++) {
        var row_data = new Array();

        // Iterate throught downloaded fields
        var position = 0;
        for (var j = 0; j < retrieved_features.length; j++) {
            //if( business_fields.indexOf(retrieved_features[j]) == -1)
            var cell_index = getFeaturePosition(business_features, retrieved_features[j]);
            if (cell_index == -1) {
                console.log('retrieved feature ' + retrieved_features[j] + ' does not exists in model. discarding');
                continue;
            }

            if (business_features[cell_index].isListed()) {
                var cell_data = data[i][retrieved_features[j]];
                console.log('Cell ' + cell_index + ': ' + cell_data);
                row_data[position++] = cell_data;
            }
        }
        // Build row and it cells
        var tr = document.createElement("tr");
        for (var j = 0; j < row_data.length; j++) {
            var td = document.createElement("td");
            // TODO: display the data depending on the data rtype
            // TODO: display custom fields display (por ejemplo, el estado de la ficha SONIGRAF, que depende de varios campos)
            td.innerHTML = row_data[j];
            tr.appendChild(td);

        }

        // Add edit action on last column
        var td = document.createElement("td");
        td.innerHTML = '<button type="button" class="btn btn-default" onclick="edit(\'' + current_object + '\',\'' + data[i][0] + '\')"><span class=" + glyphicon glyphicon-pencil"></span> Editar</button>';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    console.log('Appending results to ' + element_name + '_list_results');

    $('#' + element_name + '_list_results').append(table);

    // Give style
    $('#' + element_name + '_results_table').addClass("table");
    $('#' + element_name + '_results_table').addClass("table-hover");
    $('#' + element_name + '_results_table').addClass("table-striped");

    loading(false);
}

/**
 * This function is called from a checkbox along with a datepicker is checked or unchecked. It enable or disables the date picker.
 * @param {Type} event
 */
function setDatepicker(event) {
    console.log('setDatepicker() invoked');

    // Get the datepicker control
    var checkbox = event.target;
    var date_control_name = $('#' + checkbox.id).attr('control');
    if (date_control_name == null || date_control_name == '') {
        console.error('setDatepicker() checkbox ' + checkbox.id + ' does not have target control set');
        return;
    }
    var date_control = $('#' + date_control_name);
    console.log('checkbox changed for datepicker: ' + date_control_name);

    // Change de datepicker
    if (checkbox.checked) {
        date_control.disabled = false;
        console.log('checked');
    } else {
        date_control.disabled = false;
        date_control.val('');
        console.log('unchecked');
    }
}


/**
 * This function is invoked when the user wants to view/edit a business object
 
 * @param {String} ObjectName. BusinessObject name. eg "ficha" 
 * @param {Int} Object id
 */
function edit(ObjectName, Id) {}

/**
 * This functions saves modified data
 * 
 * 1. Detect the businessObject edited
 * 2. Creates an instance of the business object
 * 3. Retrieve all HTML form values into every BusinessObject feature
 * 4. Invokes the database 
 * 
 * @param {Type} ObjectName 
 * @param {Type} Id 
 */ 
function update(ObjectName, Id) {

}

/**
 * displays the loading layer
 * 
 * @param {Type} on 
 */ 
function loading(on) {
    if (on)
        $("#ajax_loader").show();
    else
        $("#ajax_loader").hide();
}



/**
 * Object declaraions
 */
function BusinessFeature(Name, FieldName, Listed, Order) {
    this.Name = Name;
    this.FieldName = FieldName;
    this._listed = Listed;
    this.Order;

    this.isListed = function () {
        if (this._listed != 1 && this._listed.toUpperCase().substring(0, 1) != "Y" && this._listed.toUpperCase().substring(0, 1) != "S")
            return false;
        return true;
    }
}

/**
 * Given a Feature list
 * @param {Type} Features 
 * @param {Type} FieldName 
 */ 
function getFeaturePosition(Features, FieldName) {
    for (var i = 0; i < Features.length; i++) {
        if (Features[i].FieldName == FieldName)
            return i;
    }
    return -1;
}