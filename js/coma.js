/**
 * COMA Framework
 */

/*********************************************************************************/
/**                              Global parameters                              **/
var lang = 'es';
var Business = null;

/** 
 * Errors definicion
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

var e;
var current_object = null;

function search(event) {
    try {
        loading(true);

        console.log('Search executed');

        // Fet form and searched object
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


//var business_features;
//var business_fields;


function searchCallback() {

    console.log('searchCallback() executed');
    
    // Locate containing table
    var element_name = $(Business).find('BusinessObject[name=' + current_object + ']').find('tablename').text();
    $('#' + element_name + '_list_results').empty();
    
    if(RETRIEVED_DATA==null || RETRIEVED_DATA.length==null)
    {
        console.log('Empty data returned. Exiting');
        loading(false);
        return;
    }
    
    var data = RETRIEVED_DATA;
    
    console.log('Retrieved ' + data.length + ' entries');
    if(data.length==0)
    {
        console.log('No results. Exiting...');
        // TODO: message to user
        return;
    }
    
    var table = document.createElement("table");
    table.id = element_name + '_results_table';

    var thead = document.createElement("thead");
    
    // Draw table header from business definition
    var feature_number = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature name').length;
    var business_features = new Array();
    //business_fields = new Array();
    
    // Append Id pseudo-field
    //business_features[0] = 'Id';
    //business_fields[0] = 'id';
    business_features[0] = new BusinessFeature('Id','id', 1);
    
    var th = document.createElement("th");
    th.innerHTML = "Id";
    thead.appendChild(th);    
    
    console.log('Creating header base on ' + feature_number + ' business features ');
    var header_log = '';
    var header_discarded = '';
    for(var i=0; i< feature_number; i++)
    {
        // Retreive feature info
        var is_listed = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature displaylisted')[i].textContent;
        var feat_name = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature name')[i].textContent;
        var feat_field = $(Business).find('BusinessObject[name=' + current_object + ']').find('Feature fieldname')[i].textContent;
        
        var feature = new BusinessFeature(feat_name, feat_field, is_listed);
        business_features[i+1] = feature;
        
        if(!feature.isListed())
        {
            header_discarded += '[ ' + feature.Name + ' ]';
            continue;
        }
        //business_features[i+1] = feat_name;
        //business_fields[i+1] = feat_field;
        //var th = document.createElement("th");
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
    console.log('There are ' + feature_number + ' features in business model' );
    console.log('There are ' + retrieved_features.length + ' features in retrieved data');
    
    // draw results
    // Iterate throught data
    for (var i = 0; i < data.length; i++) 
    {
        var row_data = new Array();
        
        // Iterate throught downloaded fields
        for(var j=0; j<retrieved_features.length; j++)
        {
            //if( business_fields.indexOf(retrieved_features[j]) == -1)
             var cell_index = getFeaturePosition(business_features, retrieved_features[j]);
            if( cell_index == -1)
            {
                console.log('retrieved feature ' + retrieved_features[j] + ' does not exists in model. discarding');
                continue;
            }
            //var cell_index = business_fields.indexOf(retrieved_features[j]);
            var cell_data = data[i][ retrieved_features[j]  ];
            console.log('Cell ' + cell_index + ': ' + cell_data);
            row_data[cell_index] = cell_data;
        }
        // Build cells
        var tr = document.createElement("tr");
        // Add ID columns
        //var td = document.createElement("td");
        //td.innerHTML = data[i][0];
        //tr.appendChild(td);    
        for(var j=0; j<row_data.length; j++)
        {
            var td = document.createElement("td");
            td.innerHTML = row_data[j];
            tr.appendChild(td);
        }
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


function view() {}

function update() {}


function loading(on) {
    if (on)
        $("#ajax_loader").show();
    else
        $("#ajax_loader").hide();
}



/**
 * Object declaraions
 */ 
function BusinessFeature(Name, FieldName, Listed, Order)
{
    this.Name = Name;
    this.FieldName = FieldName;
    this._listed = Listed;
    this.Order;
    
    this.isListed = function()
    {
        if(this._listed!=1 && this._listed.toUpperCase().substring(0,1)!="Y" && this._listed.toUpperCase().substring(0,1)!="S")
            return false;
        return true;
    }
}

function getFeaturePosition(Features, FieldName)
{
    console.log(Features);
    for(var i=0; i<Features.length; i++)
    {
        if(Features[i].FieldName == FieldName)
            return i;
    }
    return -1;
}