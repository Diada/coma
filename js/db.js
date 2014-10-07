/*
 * Database access layer
 * Based on: https://github.com/alixaxel/ArrestDB
 * Dani Crespo (C) 2014
 *
 * v 1.0.3 30/08/2014
 */

// Configure base URl for ArrestSQL
//var base_db_uri = "http://diadatest.com/index.php";
//var base_db_uri = "http://db.disier.com";
var base_db_uri = "http://db.diadalocal.com/index.php";

// Configura HTTP auth parameters
var HTTP_USER = 'apirest';
var HTTP_PASSWORD = 'apirest';

// Set constant for call tye
var DB_CREATE = "POST"; // POST   /table
var DB_READ = "GET"; // GET    /table[/id]
// GET    /table[/column/content]
var DB_UPDATE = "PUT"; // PUT    /table/id
var DB_DELETE = "DELETE"; // DELETE /table/id

var RETRIEVED_DATA = null;

function testConnection() {
    $.ajax({
        type: "GET",
        dataType: 'json',
        url: base_db_uri + '/users/',
        username: HTTP_USER,
        password: HTTP_PASSWORD,
        crossDomain: true,
        //xhrFields: {
        //    withCredentials: false
        //}
    })
        .done(function (data, status) {
            console.log("done!");
            console.log("Status: " + status);
            console.log("Data: " + JSON.stringify(data));
            processSuccess(null, null, data, status);
        })
        .fail(function (xhr, textStatus, errorThrown) {
            console.log("Error exeuting ");
            alert(xhr.responseText);
            alert(textStatus);
        });

}

function dbCall(callType, tableName, id, callbackFunction, postData, filterColumn, filterValue, filterList) {
    console.log("Executed dbCall(" + callType + ", " + tableName + ", " + id + ", " + eval('callbackFunction.name') + ", " + postData + ", " + filterColumn + ", " + filterValue + ", " + filterList + ")");

    var url;

    if (id == null) {
        url = base_db_uri + '/' + tableName + '/';
    } else {
        // TODO check id is a number
        url = base_db_uri + '/' + tableName + '/' + id;
    }

    if (filterColumn != null) {
        url = url + '?filter_field=' + filterColumn + '&filter_value=' + filterValue;
    }
    
    if (filterList != null && filterList != '')
    {
         url = url + '?filters={' + filterList.join() + '}';
    }

    console.log("Quering the url: " + url);

    $.ajax({
        type: callType,
        dataType: 'json',
        url: url,
        data: postData,
        username: HTTP_USER,
        password: HTTP_PASSWORD,
        crossDomain: true,
        xhrFields: {
            withCredentials: false
        }
    })
        .done(function (data, status) {
            console.log("Done with status: " + status);
            console.log(JSON.stringify(data));
            RETRIEVED_DATA = data;
            callbackFunction();
        })
        .fail(function (xhr, textStatus, errorThrown) {
            console.log("ERROR PERFORMING QUERY: " + errorThrown);
            console.log("Status: " + textStatus);
            console.log("Response: " + xhr.responseText);
        });
}


function dbSelect(tableName, id, callback, filterColumn, filterValue, filterList) {
    console.log('select(' + tableName + ')');

    dbCall(DB_READ, tableName, id, callback, null, filterColumn, filterValue, filterList);
}


function doUpdate(tableName, object, callback) {
    if (object.id == null) {
        dbCall(DB_CREATE, tableName, null, callback, object);
    } else {
        dbCall(DB_UPDATE, tableName, object.id, callback, object);
    }
}

function dbDelete(tableName, id, callback) {
    dbCall(DB_DELETE, tableName, id,  callback);
}

function dbInsert(tableName, object, callback) {
    dbCall(DB_CREATE, tableName, null, callback, object);
}