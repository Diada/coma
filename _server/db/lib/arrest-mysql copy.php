<?php
/**
 * Arrest MySQL
 * A "plug-n-play" RESTful API for your MySQL database.
 *
 * <code>
 * $arrest = new ArrestMySQL($db_config);
 * $arrest->rest();
 * </code>
 *
 * Author: Gilbert Pellegrom
 * Website: http://dev7studios.com
 * Date: Jan 2013
 * Version 1.0
 * 
 * Dani Crespo modifications
 * Added more filter options: filter_field, filter_value
 * Date: 15/08/2014
 * Added more filter options filters={field,value,operation} where opration may be 'eq','neq',l'lw','gt','aprox'. Example
 */
$DEBUG = false; 


require('lib/db.php');



class ArrestMySQL {

    /**
     * The instance of Database
     *
     * @var Database
     */
    private $db;
    /**
     * The structure of the database
     *
     * @var array
     */
    private $db_structure;
    /**
     * The URI segments
     *
     * @var array
     */
    private $segments;
    /**
     * Array of custom table indexes
     *
     * @var array
     */
    private $table_index;

    /**
     * Create an instance, optionally setting a base URI
     *
     * @param array $db_config An array of database config options. Format:
     * <code>
     * $db_config = array(
     *    'server'   => 'localhost',
     *    'database' => '',
     *    'username' => '',
     *    'password' => '',
     *    'verbose' => false
     * );
     *</code>
     * @param string $base_uri Optional base URI if not in root folder
     * @access public
     */
    public function __construct($db_config, $base_uri = '') 
    {
        $this->db = new Database($db_config);
        if(!$this->db->init()) throw new Exception($this->db->get_error());
        
	    $this->db_structure = $this->map_db($db_config['database']);
        $this->segments = $this->get_uri_segments($base_uri);
        $this->table_index = array();
    }
    
    /**
     * Handle the REST calls and map them to corresponding CRUD
     *
     * @access public
     */
    public function rest()
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Credentials: false');
        header('Access-Control-Allow-Methods: GET,PUT,POST,DELETE');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
        
        header('Content-type: application/json');
        
        if($GLOBALS['DEBUG'])
        {
            echo 'REQUEST_METHOD:'.$_SERVER['REQUEST_METHOD'].'.<br/>';
            echo 'REQUEST_URI:'.$_SERVER['REQUEST_URI'].'.<br/>';
            echo 'QUERY_STRING:'.$_SERVER['QUERY_STRING'].'.<br/>';
            echo 'PHP_SELF:'.$_SERVER['PHP_SELF'].'.<br/>';
        }
        /*
        create > POST   /table
        read   > GET    /table[/id]
        update > PUT    /table/id
        delete > DELETE /table/id
        */
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'POST':
                $this->create();
                break;
            case 'GET':
                $this->read();
                break;
            case 'PUT':
                $this->update();
                break;
            case 'DELETE':
                $this->delete();
                break;
        }
    }
    
    /**
     * Add a custom index (usually primary key) for a table
     *
     * @param string $table Name of the table
     * @param string $field Name of the index field
     * @access public
     */
    public function set_table_index($table, $field)
    {
        $this->table_index[$table] = $field;
    }
    
    /**
     * Map the stucture of the MySQL db to an array
     *
     * @param string $database Name of the database
     * @return array Returns array of db structure
     * @access private
     */
    private function map_db($database)
    {
        // Map db structure to array
        $tables_arr = array();
        $this->db->query('SHOW TABLES FROM '. $database);
        while($table = $this->db->fetch_array()){
        	if(isset($table['Tables_in_'. $database])){
        	    $table_name = $table['Tables_in_'. $database];
        	    $tables_arr[$table_name] = array();
            }
        }
        foreach($tables_arr as $table_name=>$val){
    	    $this->db->query('SHOW COLUMNS FROM '. $table_name);
    	    $fields = $this->db->fetch_all();
    	    $tables_arr[$table_name] = $fields;
	    }
	    return $tables_arr;
    }
    
    /**
     * Get the URI segments from the URL
     *
     * @param string $base_uri Optional base URI if not in root folder
     * @return array Returns array of URI segments
     * @access private
     */
    private function get_uri_segments($base_uri)
    {
        
        // Fix REQUEST_URI if required
	    if(!isset($_SERVER['REQUEST_URI'])){
            $_SERVER['REQUEST_URI'] = substr($_SERVER['PHP_SELF'], 1);
            if(isset($_SERVER['QUERY_STRING'])) $_SERVER['REQUEST_URI'] .= '?'. $_SERVER['QUERY_STRING'];
        }
        
    	$url = '';
    	$request_url = $_SERVER['REQUEST_URI'];
    	$script_url  = $_SERVER['PHP_SELF'];
    	$request_url = str_replace($base_uri, '', $request_url);

    	if($request_url != $script_url) 
            $url = trim(preg_replace('/'. str_replace('/', '\/', str_replace('index.php', '', $script_url)) .'/', '', $request_url, 1), '/');
        // Dani: this line was added 28/09/2014 to make local conversion work
        $url = str_replace('index.php', '', $script_url);
        $url = ltrim(preg_replace('/\?.*/', '', $url), '/');
        
        if($GLOBALS['DEBUG'])
        {
            echo '1. base_uri: '.$base_uri.'</br/>';
            echo '2. request_url: '.$request_url.'</br/>';
            echo '3. script_url: '.$script_url.'</br/>';
            echo '4. url:'.$url.'<br/>';
        }
         
        return explode('/', $url);
    }
    
    /**
     * Get a URI segment
     *
     * @param int $index Index of the URI segment
     * @return mixed Returns URI segment or false if none exists
     * @access private
     */
    private function segment($index)
    {
        if(isset($this->segments[$index])) return $this->segments[$index];
        return false;
    }
    
    /**
     * Handles a POST and inserts into the database
     *
     * @access private
     */
    private function create()
    {
        $table = $this->segment(0);
        
        if(!$table || !isset($this->db_structure[$table])){
            $error = array('error' => array(
                'message' => 'Not Found',
                'code' => 404
            ));
            die(json_encode($error));
        }
        
        if($data = $this->_post()){
            $this->db->insert($table, $data)
                     ->query();
            $success = array('success' => array(
                'message' => 'Success',
                'code' => 200
            ));
            die(json_encode($success));
        } else {
            $error = array('error' => array(
                'message' => 'No Content',
                'code' => 204
            ));
            die(json_encode($error));
        }
    }
    
    /**
     * Handles a GET and reads from the database
     *
     * @access private
     */
    private function read()
    {
        if($GLOBAL['debug'])
            echo '0:'.$this->segment(0).' 1:'.$this->segment(1).' 2:'.$this->segment(2).' 3:'.$this->segment(3).'<br/>';
        $table = $this->segment(0);
        $id = intval($this->segment(1));
        
        if(!$table || !isset($this->db_structure[$table])){
            $error = array('error' => array(
                'message' => 'Not Found:' . $table,
                'code' => 404
            ));
            die(json_encode($error));
        }
        
        if($id && is_int($id)) {
            $index = 'id';
            if(isset($this->table_index[$table])) $index = $this->table_index[$table];
            $this->db->select('*')
                     ->from($table)
                     ->where($index, $id)
                     ->query();
            if($result = $this->db->fetch_array()){
                die(json_encode($result));
            } else {
                $error = array('error' => array(
                    'message' => 'No Content',
                    'code' => 204
                ));
                die(json_encode($error));
            }
        } else {
            $this->db->select('*')
                     ->from($table)
                     ->where($this->_get('filter_field'), $this->_get('filter_value')) // Dani
                     ->order_by($this->_get('order_by'), $this->_get('order'))
                     ->limit(intval($this->_get('limit')), intval($this->_get('offset')))
                     ->query();
            if($result = $this->db->fetch_all()){
                die(json_encode($result));
            } else {
                $error = array('error' => array(
                    'message' => 'No Content',
                    'code' => 204
                ));
                die(json_encode($error));
            }
        }    
    }
    
    /**
     * Handles a PUT and updates the database
     *
     * @access private
     */
    private function update()
    {
        $table = $this->segment(0);
        $id = intval($this->segment(1));

        if(!$table || !isset($this->db_structure[$table]) || !$id){
            $error = array('error' => array(
                'message' => 'Not Found',
                'code' => 404
            ));
            die(json_encode($error));
        }
        
        $index = 'id';
        if(isset($this->table_index[$table])) $index = $this->table_index[$table];
        $this->db->select('*')
                 ->from($table)
                 ->where($index, $id)
                 ->query();
        if($result = $this->db->fetch_array()){
            $this->db->update($table)
                     ->set($this->_put())
                     ->where($index, $id)
                     ->query();
            $success = array('success' => array(
                'message' => 'Success',
                'code' => 200
            ));
            die(json_encode($success));
        } else {
            $error = array('error' => array(
                'message' => 'No Content',
                'code' => 204
            ));
            die(json_encode($error));
        }
    }
    
    /**
     * Handles a DELETE and deletes from the database
     *
     * @access private
     */
    private function delete()
    {
        $table = $this->segment(0);
        $id = intval($this->segment(1));
        
        if(!$table || !isset($this->db_structure[$table]) || !$id){
            $error = array('error' => array(
                'message' => 'Not Found',
                'code' => 404
            ));
            die(json_encode($error));
        }
        
        $index = 'id';
        if(isset($this->table_index[$table])) $index = $this->table_index[$table];
        $this->db->select('*')
                 ->from($table)
                 ->where($index, $id)
                 ->query();
        if($result = $this->db->fetch_array()){
            $this->db->delete($table)
                 ->where($index, $id)
                 ->query();
            $success = array('success' => array(
                'message' => 'Success',
                'code' => 200
            ));
            die(json_encode($success));
        } else {
            $error = array('error' => array(
                'message' => 'No Content',
                'code' => 204
            ));
            die(json_encode($error));
        }
    }
    
    /**
     * Helper function to retrieve $_GET variables
     *
     * @param string $index Optional $_GET index
     * @return mixed Returns the $_GET var at the specified index,
     *               the whole $_GET array or false
     * @access private
     */
    private function _get($index = '')
    {
        if($index){
            if(isset($_GET[$index]) && $_GET[$index]) return strip_tags($_GET[$index]);
        } else {
            if(isset($_GET) && !empty($_GET)) return $_GET;
        }
        return false;
    }
    
    /**
     * Helper function to retrieve $_POST variables
     *
     * @param string $index Optional $_POST index
     * @return mixed Returns the $_POST var at the specified index,
     *               the whole $_POST array or false
     * @access private
     */
    private function _post($index = '')
    {
        if($index){
            if(isset($_POST[$index]) && $_POST[$index]) return $_POST[$index];
        } else {
            if(isset($_POST) && !empty($_POST)) return $_POST;
        }
        return false;
    }
    
    /**
     * Helper function to retrieve PUT variables
     *
     * @return mixed Returns the contents of PUT as an array
     * @access private
     */
    private function _put()
    {
        $output = array();
        parse_str(file_get_contents('php://input'), $output);
        return $output;
    }
    
}

?>